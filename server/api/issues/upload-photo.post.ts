import { useDb } from '../../utils/db'
import { s3Service } from '../services/s3.service'

export default defineEventHandler(async (event) => {
  const { Issue } = useDb()

  // Check if user is authenticated
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    // Read the multipart form data
    const data = await readMultipartFormData(event)

    if (!data || !data.length) {
      throw createError({
        statusCode: 400,
        message: 'No form data provided'
      })
    }

    // Find the issue ID in the form data
    const issueIdField = data.find(field => field.name === 'issueId')
    const issueId = issueIdField ? issueIdField.data.toString() : null

    if (!issueId) {
      throw createError({
        statusCode: 400,
        message: 'Issue ID is required'
      })
    }

    // Find the file in the form data
    const fileField = data.find(field => field.name === 'file')
    if (!fileField || !fileField.filename) {
      throw createError({
        statusCode: 400,
        message: 'File is required'
      })
    }

    // Verify the issue exists and user has permission
    const issue = await Issue.findById(issueId)
    if (!issue) {
      throw createError({
        statusCode: 404,
        message: 'Issue not found'
      })
    }

    // Check if user has permission to update this issue
    if (event.context.user.role !== 'admin' && issue.createdBy.toString() !== event.context.user._id.toString()) {
      throw createError({
        statusCode: 403,
        message: 'No tienes permiso para actualizar este issue'
      })
    }

    // Upload the file to S3 using the existing service
    const buffer = Buffer.isBuffer(fileField.data)
      ? fileField.data
      : Buffer.from(fileField.data)

    const { key, url } = await s3Service.uploadFile({
      file: buffer,
      fileName: fileField.filename,
      contentType: fileField.type || 'application/octet-stream',
      folder: `issues/${issueId}`,
      metadata: {
        issueId,
        uploadedBy: event.context.user._id.toString(),
        uploadedAt: new Date().toISOString()
      }
    })

    // Add the photo to the issue
    const photo = {
      id: Date.now().toString(),
      url,
      uploadedAt: new Date()
    }

    issue.photos.push(photo)
    const updatedIssue = await issue.save()

    return {
      data: photo,
      success: true
    }
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error uploading photo'
    })
  }
})
