# Image Processing Flow for PDF Generation

## Overview
This document explains the correct flow for handling images in safety plan PDF generation, ensuring images are properly embedded in the final PDF documents.

## The Problem
Previously, images were processed **after** Handlebars template rendering, which could lead to:
- Expired S3 URLs not being accessible during PDF generation
- External images failing to load in the final PDF
- Inconsistent image rendering across different templates

## The Solution
Images are now processed **before** Handlebars rendering, ensuring all image URLs are converted to base64 data URLs and properly embedded in the template content.

## Correct Flow

### 1. Image Upload (Frontend)
```typescript
// User uploads images via DetallesGraficosComponent
// Images are stored in S3 with signed URLs
// URLs are stored in plan.det_graf array
```

### 2. Template Data Preparation (Backend)
```typescript
// Template data includes image references
const templateData = {
  nom_obra: 'Project Name',
  detalles_graficos: '![Image 1](https://s3-url/image1.jpg)\n\n![Image 2](https://s3-url/image2.png)',
  det_graf: [
    { name: 'Image 1', url: 'https://s3-url/image1.jpg', isAdminShared: false },
    { name: 'Image 2', url: 'https://s3-url/image2.png', isAdminShared: true }
  ]
}
```

### 3. Image Preprocessing (NEW)
```typescript
// Images are converted to base64 BEFORE Handlebars rendering
const processedTemplate = await preprocessTemplateImages(templateContent, templateData);

// This ensures:
// - All S3 URLs are converted to base64 data URLs
// - Expired URLs are refreshed if possible
// - Images are embedded directly in the template content
```

### 4. Handlebars Rendering
```typescript
// Template variables are processed with image content already embedded
const renderedContent = renderTemplate(processedTemplate, templateData);
```

### 5. PDF Generation
```typescript
// Markdown is converted to HTML
const htmlContent = await marked(renderedContent);

// HTML is parsed and converted to PDF document definition
const documentDefinition = parseHtmlToPdfDefinition(htmlContent, title);

// PDF is generated with embedded images
const pdfBuffer = await generatePDF(documentDefinition);
```

## Template Usage Examples

### Using detalles_graficos Variable
```handlebars
# Safety Plan - {{nom_obra}}

## Graphical Details
{{detalles_graficos}}
```

### Using Individual Image Variables
```handlebars
# Project Report

![Main Image]({{imagen_principal}})

## Additional Details
{{detalles_graficos_admin}}

## User Images
{{detalles_graficos_user}}
```

### Hardcoded Images in Template
```handlebars
# Report with Static Images

![Company Logo](https://example.com/logo.png)

{{detalles_graficos}}

![Signature](https://example.com/signature.jpg)
```

## Key Benefits

1. **Reliability**: Images are embedded as base64 data URLs, eliminating external dependencies
2. **Performance**: No external HTTP requests during PDF generation
3. **Consistency**: All images are processed the same way regardless of source
4. **Error Handling**: Failed image conversions don't break the entire PDF generation
5. **S3 Compatibility**: Expired S3 URLs are automatically refreshed when possible

## Implementation Details

### Image Preprocessing (`templateImageProcessor.ts`)
- Converts external URLs to base64 data URLs
- Handles S3 signed URL expiration
- Processes markdown image syntax: `![alt](url)`
- Processes HTML image tags: `<img src="url">`
- Validates image accessibility
- Provides fallback mechanisms for failed conversions

### S3 URL Handling (`imageUtils.ts`)
- Detects S3 signed URLs with expiration parameters
- Extracts S3 object keys from signed URLs
- Generates fresh signed URLs when needed
- Handles various S3 URL formats
- Implements timeout and retry mechanisms

## Error Handling

If image preprocessing fails:
- Original template content is used as fallback
- Individual image failures don't break the entire process
- Detailed logging helps identify problematic images
- PDF generation continues with available content

## Testing

Use the provided test script to verify image preprocessing:
```bash
node test-image-preprocessing.js
```

This will test:
- Markdown image syntax processing
- HTML image tag processing
- Template variable substitution
- Base64 conversion
- Error handling scenarios