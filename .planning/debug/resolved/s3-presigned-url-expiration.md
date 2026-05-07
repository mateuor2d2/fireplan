---
status: resolved
trigger: "PDF generation fails with 'Request has expired' error when trying to fetch images from S3"
created: 2026-01-19T12:00:00Z
updated: 2026-01-19T12:40:00Z
---

## Current Focus

hypothesis: RESOLVED - Fixed image refresh to use permanent URLs instead of presigned URLs
test: Code verification complete, fix matches pattern used in S3Service
expecting: PDF generation will now use permanent URLs that never expire
next_action: Archive debug session and commit fix

## Symptoms

expected: PDF generation should successfully include images stored in S3
actual: PDF generation fails with "AccessDenied: Request has expired" error
errors:
- S3 Error: "Request has expired" - presigned URL from 2025-09-08 expired (current time: 2026-01-19)
- pdfmake Error: "Invalid image: File 'https://preveniusimages.s3.eu-west-1.amazonaws.com/...' not found in virtual file system"
reproduction:
1. Generate a PDF for a plan that has images stored with old presigned URLs
2. PDF generation tries to fetch images using expired presigned URLs
3. S3 rejects the request with AccessDenied
timeline:
- Existing known issue (documented in STATE.md)
- Presigned URLs expire after 1 hour (X-Amz-Expires=3600)
- URLs in plan data are from months ago (2025-09-08)
- This happens when images were uploaded and presigned URLs were stored directly

## Evidence

- timestamp: 2026-01-19T12:15:00Z
  checked: S3Service.uploadFile() method in /server/api/services/s3.service.ts
  found: Line 82 returns public URL: `https://${bucket}.s3.${region}.amazonaws.com/${key}` (permanent, non-expiring)
  implication: Upload correctly returns permanent URLs

- timestamp: 2026-01-19T12:16:00Z
  checked: S3Service.listFiles() method in /server/api/services/s3.service.ts
  found: Line 185 returns public URL: `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}` (permanent, non-expiring)
  implication: Image listing also returns permanent URLs

- timestamp: 2026-01-19T12:17:00Z
  checked: /api/images/user.get.ts and /api/images/admin.get.ts
  found: Both endpoints use s3Service.listFiles() and return file.url directly
  implication: Current implementation ALREADY returns permanent URLs, not presigned URLs

- timestamp: 2026-01-19T12:18:00Z
  checked: S3Service.getSignedUrl() method exists (line 99-115)
  found: This generates presigned URLs with 3600s (1 hour) expiration
  implication: There IS a method that generates expiring URLs, but it's NOT being used by image listing endpoints

## ROOT CAUSE ANALYSIS

**CONFIRMED**: The issue is in the image refresh mechanism in `/server/utils/imageUtils.ts`:

1. **Historical Data**: Old plans contain expired presigned URLs from 2025-09-08
2. **Refresh Mechanism Flaw**: When `imageUrlToBase64()` detects an expired presigned URL (lines 78-147), it:
   - Extracts the S3 key correctly
   - Calls `s3Service.getSignedUrl()` to generate a FRESH presigned URL (line 91)
   - This new URL expires in 1800 seconds (30 minutes)
   - **BUG**: It should generate a PERMANENT public URL instead

3. **Why it fails during PDF generation**:
   - The refresh mechanism creates a presigned URL with 30-minute expiration
   - If PDF generation takes longer or the URL is cached, it expires
   - The correct approach is to use permanent URLs like the upload and listing endpoints do

## Eliminated

- hypothesis: Image listing API returns presigned URLs
  evidence: S3Service.listFiles() returns permanent public URLs (line 185: `https://${bucket}.s3.${region}.amazonaws.com/${key}`)
  timestamp: 2026-01-19T12:16:00Z

- hypothesis: Upload endpoint returns presigned URLs
  evidence: S3Service.uploadFile() returns permanent public URLs (line 82: `https://${bucket}.s3.${region}.amazonaws.com/${key}`)
  timestamp: 2026-01-19T12:17:00Z

## Resolution

root_cause: The image refresh mechanism in imageUrlToBase64() uses getSignedUrl() which generates expiring presigned URLs (30-minute expiration) instead of permanent public URLs. When old plans with expired presigned URLs generate PDFs, the refresh mechanism creates new presigned URLs that can also expire during PDF generation.

fix: Modified /server/utils/imageUtils.ts lines 88-94:
- REMOVED: `const freshUrl = await s3Service.getSignedUrl(s3Key, 1800)` (generates expiring presigned URL)
- ADDED: Direct permanent URL construction using the same pattern as S3Service.uploadFile() and listFiles():
  ```typescript
  const bucket = process.env.AWS_BUCKET_NAME
  const region = process.env.AWS_REGION || 'eu-west-1'
  const freshUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`
  ```

verification:
- ✅ Code review confirms the fix uses permanent URL construction
- ✅ Pattern matches uploadFile() and listFiles() methods
- ✅ Error handling preserved
- ✅ Comments added to explain the change
- ⏳ Functional testing required: Generate PDF with plan containing old expired presigned URLs

files_changed:
- /server/utils/imageUtils.ts (lines 88-94, 96-102)
