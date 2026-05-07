# Debugging PDF Image Issues

## Current Status
- Images are being successfully converted to base64 (confirmed in logs)
- PDF generation code finds the images and attempts to add them
- But images don't appear in final PDF

## Potential Issues to Investigate

### 1. Base64 Data URL Format
**Issue**: pdfmake might be picky about base64 format
**Check**: Ensure proper format `data:image/png;base64,iVBORw0KGgo...`

### 2. Image Size Limitations  
**Issue**: Very large base64 strings (277K+ chars) might cause issues
**Check**: Try with smaller images or add size limits

### 3. MIME Type Issues
**Issue**: Wrong MIME type in data URL
**Check**: Ensure correct `image/png`, `image/jpeg`, etc.

### 4. PDF Structure Issues
**Issue**: Images might be added but not visible due to positioning
**Check**: Verify image positioning, margins, page boundaries

### 5. pdfmake Version/Limitations
**Issue**: Known issues with base64 images in certain pdfmake versions
**Check**: Test with external URLs vs base64

## Debugging Steps

### Step 1: Test with Smaller Images
Let's try converting images to a smaller size before base64 encoding:

```typescript
// Add image resizing before base64 conversion
const resizeImage = async (imageUrl: string, maxWidth: number = 800): Promise<string> => {
  // Implementation would go here
  // For now, let's just return original or skip large images
};
```

### Step 2: Validate Base64 Format
Add validation to ensure proper base64 format:

```typescript
const validateBase64Image = (dataUrl: string): boolean => {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return false;
  
  const [, mimeType, base64Data] = match;
  
  // Check if it's a valid base64 string
  try {
    const decoded = Buffer.from(base64Data, 'base64');
    return decoded.length > 0;
  } catch {
    return false;
  }
};
```

### Step 3: Test Different Image Sources
Compare these scenarios:
1. **Manual markdown**: `![Test](https://example.com/small-image.png)`
2. **Template variable**: `{{detalles_graficos}}` with small image
3. **External URL**: Keep as external URL (don't convert to base64)
4. **Different sizes**: Small (100KB) vs Large (1MB+) images

### Step 4: Check PDF Output Structure
Add debugging to see what's actually in the PDF document definition:

```typescript
// Log the actual PDF document structure
console.log(`[PDF Generation] Document content structure:`, {
  totalElements: content.length,
  imageElements: content.filter(item => item.image).length,
  textElements: content.filter(item => item.text).length,
  firstFewElements: content.slice(0, 5)
});
```

## Key Questions to Answer

1. **What's the exact difference** between manual markdown and template variable processing?
2. **Are the images being added to the PDF structure** but not rendering?
3. **Is there a size threshold** where images stop working?
4. **Does the image format matter** (PNG vs JPEG)?
5. **Are there any pdfmake errors** being silently caught?

## Immediate Testing

Let's try these quick fixes:

### Option 1: Limit Image Size
Convert only images under a certain size:

```typescript
// In templateImageProcessor.ts
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

if (arrayBuffer.byteLength <= MAX_IMAGE_SIZE) {
  // Convert to base64
} else {
  console.warn(`[Image Conversion] Image too large (${arrayBuffer.byteLength} bytes), keeping original URL`);
  return url; // Keep original URL
}
```

### Option 2: Use External URLs for Large Images
Keep large images as external URLs and handle CORS properly:

```typescript
// In the PDF generation, try external URLs for large images
if (imageUrl.length > 100000) { // 100KB threshold
  console.log(`[PDF Generation] Using external URL for large image`);
  // Keep as external URL
} else {
  // Use base64
}
```

### Option 3: Test with a Small Image
Replace one of the images with a tiny test image:

```typescript
// Use a small test image
const testImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==";
return testImageBase64; // 1x1 pixel red dot
```

Let's start with Option 3 - test with a tiny image to see if the issue is size-related. Can you modify one of the images in your template data to use this tiny base64 image and see if it appears in the PDF?