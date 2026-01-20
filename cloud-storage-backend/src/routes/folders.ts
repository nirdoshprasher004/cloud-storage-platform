import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { AuthenticatedRequest } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'

const router = express.Router()

// Create folder
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('parentId').optional().isUUID()
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

      const { name, parentId } = req.body
      const userId = req.user!.id

      // Check if parent folder exists and user has access
      if (parentId) {
        const { data: parentFolder, error: parentError } = await supabase
          .from('folders')
          .select('id, owner_id')
          .eq('id', parentId)
          .eq('is_deleted', false)
          .single()

        if (parentError || !parentFolder) {
          throw createError(404, 'PARENT_NOT_FOUND', 'Parent folder not found')
        }

        if (parentFolder.owner_id !== userId) {
          throw createError(403, 'FORBIDDEN', 'No access to parent folder')
        }
      }

      // Check for duplicate names in the same parent
      const { data: existingFolder } = await supabase
        .from('folders')
        .select('id')
        .eq('name', name)
        .eq('owner_id', userId)
        .eq('parent_id', parentId || null)
        .eq('is_deleted', false)
        .single()

      if (existingFolder) {
        throw createError(409, 'DUPLICATE_NAME', 'Folder with this name already exists')
      }

      // Create folder
      const folderId = uuidv4()
      const { data: folder, error } = await supabase
        .from('folders')
        .insert({
          id: folderId,
          name,
          owner_id: userId,
          parent_id: parentId || null
        })
        .select()
        .single()

      if (error) {
        throw createError(500, 'CREATE_FAILED', 'Failed to create folder')
      }

      res.status(201).json({
        folder
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get folder contents
router.get('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid folder ID'
          }
        })
      }

      const folderId = req.params.id
      const userId = req.user!.id

      // Get folder details
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('is_deleted', false)
        .single()

      if (folderError || !folder) {
        throw createError(404, 'FOLDER_NOT_FOUND', 'Folder not found')
      }

      // Check access permissions
      if (folder.owner_id !== userId) {
        // Check if folder is shared with user
        const { data: share } = await supabase
          .from('shares')
          .select('role')
          .eq('resource_type', 'folder')
          .eq('resource_id', folderId)
          .eq('grantee_user_id', userId)
          .single()

        if (!share) {
          throw createError(403, 'FORBIDDEN', 'No access to this folder')
        }
      }

      // Get subfolders
      const { data: subfolders, error: subfoldersError } = await supabase
        .from('folders')
        .select('id, name, created_at, updated_at')
        .eq('parent_id', folderId)
        .eq('is_deleted', false)
        .order('name')

      if (subfoldersError) {
        throw createError(500, 'FETCH_FAILED', 'Failed to fetch subfolders')
      }

      // Get files
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('id, name, mime_type, size_bytes, created_at, updated_at')
        .eq('folder_id', folderId)
        .eq('is_deleted', false)
        .order('name')

      if (filesError) {
        throw createError(500, 'FETCH_FAILED', 'Failed to fetch files')
      }

      // Get folder path (breadcrumbs)
      const path = await getFolderPath(folderId)

      res.json({
        folder,
        children: {
          folders: subfolders || [],
          files: files || []
        },
        path
      })
    } catch (error) {
      next(error)
    }
  }
)

// Update folder
router.patch('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('parentId').optional().isUUID()
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

      const folderId = req.params.id
      const userId = req.user!.id
      const { name, parentId } = req.body

      // Check folder exists and user owns it
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('owner_id', userId)
        .eq('is_deleted', false)
        .single()

      if (folderError || !folder) {
        throw createError(404, 'FOLDER_NOT_FOUND', 'Folder not found or no access')
      }

      const updates: any = { updated_at: new Date().toISOString() }

      if (name && name !== folder.name) {
        // Check for duplicate names
        const { data: existingFolder } = await supabase
          .from('folders')
          .select('id')
          .eq('name', name)
          .eq('owner_id', userId)
          .eq('parent_id', parentId !== undefined ? parentId : folder.parent_id)
          .eq('is_deleted', false)
          .neq('id', folderId)
          .single()

        if (existingFolder) {
          throw createError(409, 'DUPLICATE_NAME', 'Folder with this name already exists')
        }

        updates.name = name
      }

      if (parentId !== undefined && parentId !== folder.parent_id) {
        // Validate parent folder
        if (parentId) {
          const { data: parentFolder, error: parentError } = await supabase
            .from('folders')
            .select('id')
            .eq('id', parentId)
            .eq('owner_id', userId)
            .eq('is_deleted', false)
            .single()

          if (parentError || !parentFolder) {
            throw createError(404, 'PARENT_NOT_FOUND', 'Parent folder not found')
          }

          // Prevent moving folder into itself or its descendants
          if (await isDescendant(folderId, parentId)) {
            throw createError(400, 'INVALID_MOVE', 'Cannot move folder into itself or its descendants')
          }
        }

        updates.parent_id = parentId
      }

      // Update folder
      const { data: updatedFolder, error: updateError } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single()

      if (updateError) {
        throw createError(500, 'UPDATE_FAILED', 'Failed to update folder')
      }

      res.json({
        folder: updatedFolder
      })
    } catch (error) {
      next(error)
    }
  }
)

// Delete folder (soft delete)
router.delete('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid folder ID'
          }
        })
      }

      const folderId = req.params.id
      const userId = req.user!.id

      // Check folder exists and user owns it
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('owner_id', userId)
        .eq('is_deleted', false)
        .single()

      if (folderError || !folder) {
        throw createError(404, 'FOLDER_NOT_FOUND', 'Folder not found or no access')
      }

      // Soft delete folder
      const { error: deleteError } = await supabase
        .from('folders')
        .update({ 
          is_deleted: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', folderId)

      if (deleteError) {
        throw createError(500, 'DELETE_FAILED', 'Failed to delete folder')
      }

      res.json({
        message: 'Folder deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// Helper function to get folder path
async function getFolderPath(folderId: string): Promise<Array<{id: string, name: string}>> {
  const path: Array<{id: string, name: string}> = []
  let currentId: string | null = folderId

  while (currentId) {
    const { data: folder } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .eq('is_deleted', false)
      .single()

    if (!folder) break

    path.unshift({ id: folder.id, name: folder.name })
    currentId = folder.parent_id
  }

  return path
}

// Helper function to check if target is a descendant of source
async function isDescendant(sourceId: string, targetId: string): Promise<boolean> {
  if (sourceId === targetId) return true

  const { data: children } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', sourceId)
    .eq('is_deleted', false)

  if (!children) return false

  for (const child of children) {
    if (await isDescendant(child.id, targetId)) {
      return true
    }
  }

  return false
}

export default router