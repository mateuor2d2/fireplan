// Debug script to compare working vs non-working image scenarios

// Working scenario: Manual markdown in template
const workingTemplate = `
# Safety Plan

## Manual Image (This Works)
![Manual Image](https://preveniusimages.s3.eu-west-1.amazonaws.com/test-image.png)

## Template Variable (This Doesn't Work)
{{detalles_graficos}}
`

// Non-working scenario: Template with variable
const templateData = {
  detalles_graficos: `![Test Image](https://preveniusimages.s3.eu-west-1.amazonaws.com/users/688dc62f90c8c8db23e898a4/test-image.png)`
}

// Let's simulate the processing
const marked = require('marked')

console.log('=== DEBUGGING IMAGE PROCESSING COMPARISON ===\n')

// 1. Working scenario
console.log('1. WORKING SCENARIO - Manual markdown:')
console.log('Template content:', workingTemplate)

const workingHtml = marked(workingTemplate)
console.log('HTML output:', workingHtml)

const workingImgTags = workingHtml.match(/<img[^>]*>/gi)
console.log('Found img tags:', workingImgTags)

// 2. Non-working scenario
console.log('\n2. NON-WORKING SCENARIO - Template variable:')
console.log('Template data:', templateData)

const filledTemplate = workingTemplate.replace('{{detalles_graficos}}', templateData.detalles_graficos)
console.log('Filled template:', filledTemplate)

const nonWorkingHtml = marked(filledTemplate)
console.log('HTML output:', nonWorkingHtml)

const nonWorkingImgTags = nonWorkingHtml.match(/<img[^>]*>/gi)
console.log('Found img tags:', nonWorkingImgTags)

// 3. Compare the differences
console.log('\n3. COMPARISON:')
if (workingImgTags && nonWorkingImgTags) {
  console.log('Working img tag:', workingImgTags[0])
  console.log('Non-working img tag:', nonWorkingImgTags[0])

  // Extract src attributes
  const workingSrc = workingImgTags[0].match(/src="([^"]+)"/)
  const nonWorkingSrc = nonWorkingImgTags[0].match(/src="([^"]+)"/)

  console.log('Working src:', workingSrc ? workingSrc[1] : 'No src found')
  console.log('Non-working src:', nonWorkingSrc ? nonWorkingSrc[1] : 'No src found')

  // Check for differences in attributes
  console.log('Working attributes:', workingImgTags[0].match(/\w+="[^"]*"/g))
  console.log('Non-working attributes:', nonWorkingImgTags[0].match(/\w+="[^"]*"/g))
}
