import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { AuthenticatedRequest } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'

const router = express.Router()

// Initialize file upload
router.post('/init',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('mimeType').notEmpty(),
    body('sizeBytes').isInt({ min: 1 }),
    body('folderId').optional().isUUID()
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        })
      }

      const { name, mimeType, sizeBytes, folderId } = req.body
      const userId = req.user!.id

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024
      if (sizeBytes > maxSize) {
        throw createError(400, 'FILE_TOO_LARGE', 'File size exceeds 100MB limit')
      }

      // Validate MIME type
      const allowedTypes = [
        'image/', 'video/', 'audio/', 'text/', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument',
        'application/zip', 'application/x-zip-compressed'
      ]
      
      const isAllowed = allowedTypes.some(type => mimeType.startsWith(type))
      if (!isAllowed) {
        throw createError(400, 'INVALID_FILE_TYPE', 'File type not allowed')
      }

      // Check folder access if specified
      if (folderId) {
        const { data: folder, error: folderError } = await supabase
          .from('folders')
          .select('owner_id')
          .eq('id', folderId)
          .eq('is_deleted', false)
          .single()

        if (folderError || !folder) {
          throw createError(404, 'FOLDER_NOT_FOUND', 'Folder not found')
        }

        if (folder.owner_id !== userId) {
          throw createError(403, 'FORBIDDEN', 'No access to folder')
        }
      }

      // Generate file ID and storage key
      const fileId = uuidv4()
      const fileExtension = name.split('.').pop() || ''
      const storageKey = `tenants/${userId}/files/${fileId}-${Date.now()}.${fileExtension}`

      // Create file record with uploading status
      const { data: file, error: fileError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          storage_key: storageKey,
          owner_id: userId,
          folder_id: folderId || null
        })
        .select()
        .single()

      if (fileError) {
        throw createError(500, 'CREATE_FAILED', 'Failed to initialize file upload')
      }

      // Generate signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .createSignedUploadUrl(storageKey)

      if (uploadError) {
        throw createError(500, 'UPLOAD_URL_FAILED', 'Failed to generate upload URL')
      }

      res.status(201).json({
        fileId,
        storageKey,
        upload: {
          method: 'single',
          url: uploadData.signedUrl,
          token: uploadData.token
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Complete file upload
router.post('/complete',
  [
    body('fileId').isUUID(),
    body('checksum').optional().isString()
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        })
      }

      const { fileId, checksum } = req.body
      const userId = req.user!.id

      // Get file record
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', userId)
        .single()

      if (fileError || !file) {
        throw createError(404, 'FILE_NOT_FOUND', 'File not found')
      }

      // Verify file exists in storage
      const { data: storageFile, error: storageError } = await supabase.storage
        .from('files')
        .list('', {
          search: file.storage_key.split('/').pop()
        })

      if (storageError || !storageFile?.length) {
        throw createError(400, 'UPLOAD_NOT_FOUND', 'File upload not found in storage')
      }

      // Update file record
      const updates: any = {
        updated_at: new Date().toISOString()
      }

      if (checksum) {
        updates.checksum = checksum
      }

      const { data: updatedFile, error: updateError } = await supabase
        .from('files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single()

      if (updateError) {
        throw createError(500, 'UPDATE_FAILED', 'Failed to complete upload')
      }

      res.json({
        file: updatedFile,
        message: 'Upload completed successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get file details and download URL
router.get('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file ID'
          }
        })
      }

      const fileId = req.params.id
      const userId = req.user!.id

      // Get file details
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('is_deleted', false)
        .single()

      if (fileError || !file) {
        throw createError(404, 'FILE_NOT_FOUND', 'File not found')
      }

      // Check access permissions
      if (file.owner_id !== userId) {
        // Check if file is shared with user
        const { data: share } = await supabase
          .from('shares')
          .select('role')
          .eq('resource_type', 'file')
          .eq('resource_id', fileId)
          .eq('grantee_user_id', userId)
          .single()

        if (!share) {
          throw createError(403, 'FORBIDDEN', 'No access to this file')
        }
      }

      // Generate signed download URL (valid for 1 hour)
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('files')
        .createSignedUrl(file.storage_key, 3600)

      if (downloadError) {
        throw createError(500, 'DOWNLOAD_URL_FAILED', 'Failed to generate download URL')
      }

      res.json({
        file,
        signedUrl: downloadData.signedUrl
      })
    } catch (error) {
      next(error)
    }
  }
)

// Update file
router.patch('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('folderId').optional().isUUID()
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        })
      }

      const fileId = req.params.id
      const userId = req.user!.id
      const { name, folderId } = req.body

      // Check file exists and user owns it
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', userId)
        .eq('is_deleted', false)
        .single()

      if (fileError || !file) {
        throw createError(404, 'FILE_NOT_FOUND', 'File not found or no access')
      }

      const updates: any = { updated_at: new Date().toISOString() }

      if (name && name !== file.name) {
        updates.name = name
      }

      if (folderId !== undefined && folderId !== file.folder_id) {
        // Validate folder
        if (folderId) {
          const { data: folder, error: folderError } = await supabase
            .from('folders')
            .select('id')
            .eq('id', folderId)
            .eq('owner_id', userId)
            .eq('is_deleted', false)
            .single()

          if (folderError || !folder) {
            throw createError(404, 'FOLDER_NOT_FOUND', 'Folder not found')
          }
        }

        updates.folder_id = folderId
      }

      // Update file
      const { data: updatedFile, error: updateError } = await supabase
        .from('files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single()

      if (updateError) {
        throw createError(500, 'UPDATE_FAILED', 'Failed to update file')
      }

      res.json({
        file: updatedFile
      })
    } catch (error) {
      next(error)
    }
  }
)

// Delete file (soft delete)
router.delete('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file ID'
          }
        })
      }

      const fileId = req.params.id
      const userId = req.user!.id

      // Check file exists and user owns it
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', userId)
        .eq('is_deleted', false)
        .single()

      if (fileError || !file) {
        throw createError(404, 'FILE_NOT_FOUND', 'File not found or no access')
      }

      // Soft delete file
      const { error: deleteError } = await supabase
        .from('files')
        .update({ 
          is_deleted: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', fileId)

      if (deleteError) {
        throw createError(500, 'DELETE_FAILED', 'Failed to delete file')
      }

      res.json({
        message: 'File deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router