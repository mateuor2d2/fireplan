# Summary 15-01: Review and Fix Detalles Gráficos PDF Generation

**Phase:** 15-detalles-graficos-review  
**Plan:** 15-01  
**Status:** ✅ COMPLETE  
**Completed:** 2026-03-15  
**Commit:** 8a93d94

---

## What Was Fixed

### Issue 1: Missing Template Variable
**Problem:** The `{{detalles_graficos}}` Handlebars template variable was not being populated in the PDF generation.

**Root Cause:** The `det_graf` array from the plan data was not being converted to a format the template could render.

**Fix:** Added markdown format generation from `det_graf` array in `server/api/planes/[id]/generate-pdf.get.ts`:
```typescript
// Generate detalles_graficos content from det_graf array
detalles_graficos: (() => {
  if (!plan.det_graf || plan.det_graf.length === 0) {
    return 'No hay detalles gráficos disponibles.'
  }
  return plan.det_graf.map((img: any) => `![${img.name || 'Image'}](${img.url})`).join('\n\n')
})()
```

### Issue 2: CORS Blocking Image Loading
**Problem:** Browser blocked S3 image loading with CORS error: "falta la cabecera CORS 'Access-Control-Allow-Origin'"

**Root Cause:** Images loaded directly from S3 were cross-origin requests without proper CORS headers on the client side.

**Fix:** Added `crossorigin="anonymous"` attribute to all `<img>` tags in `DetallesGraficosSelector.vue`:
- Line 64: Main image display
- Line 217: User images grid
- Line 332: Admin images grid
- Line 705: JavaScript image loading with `img.crossOrigin = 'anonymous'`

### Issue 3: S3 Configuration Issues
**Problem:** S3 client configuration not reliably loading environment variables.

**Fix:** Updated `server/utils/s3-client.ts`:
- Added `override: true` to dotenv config to ensure .env values take precedence
- Added explicit S3 endpoint URL construction: `https://s3-${region}.amazonaws.com`
- Maintained `forcePathStyle: true` for compatibility

### Issue 4: Insecure Public URLs
**Problem:** Using public S3 URLs without authentication could expose images.

**Fix:** Modified `server/utils/s3-upload.ts` to use signed URLs (24-hour expiry) instead of public URLs:
```typescript
// Generate signed URL for secure access (expires in 24 hours)
const signedUrl = await getSignedDownloadUrl(item.Key, 86400)
return {
  key: item.Key,
  url: signedUrl,  // Changed from: url: getPublicUrl(item.Key)
  // ...
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `server/api/planes/[id]/generate-pdf.get.ts` | Added `detalles_graficos` template variable generation from `det_graf` array |
| `app/components/DetallesGraficosSelector.vue` | Added `crossorigin="anonymous"` to all image tags for CORS support |
| `server/utils/s3-client.ts` | Fixed dotenv loading with override, added explicit S3 endpoint |
| `server/utils/s3-upload.ts` | Switched to signed URLs (24h expiry) for secure image access |

---

## Test Results

✅ **All Success Criteria Met:**

1. ✅ Detalles graficos images appear in generated PDFs
2. ✅ Images are properly sized and positioned
3. ✅ All images from the plan are included
4. ✅ Images display in correct order
5. ✅ No console errors during PDF generation
6. ✅ PDF generation completes without timeout

**Verified Flow:**
1. Images upload successfully to S3
2. Images display in detalles gráficos selector (CORS working)
3. PDF generation includes all images
4. Images render correctly in final PDF document

---

## Technical Details

**CORS Configuration:**
- Client-side: `crossorigin="anonymous"` on all img elements
- Server-side: S3 signed URLs ensure authenticated access

**Image Pipeline:**
```
User Upload → S3 Storage → Signed URL (24h) → Frontend Display → PDF Generation (base64 conversion)
```

**Security Improvements:**
- Signed URLs instead of public URLs
- 24-hour URL expiry limits exposure window
- CORS headers properly configured for cross-origin access

---

## Related Context

This fix completes the detalles gráficos feature that allows users to attach images to safety plans. The images now properly:
- Display in the plan editor
- Generate in PDF outputs
- Load from S3 with proper authentication

---

*Completed by: Claude*  
*Phase 15-01 Status: ✅ COMPLETE*
