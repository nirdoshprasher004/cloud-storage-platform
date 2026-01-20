import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'
import { AuthenticatedRequest } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'

const router = express.Router()

// Create user share
router.post('/',
  [
    body('resourceType').isIn(['file', 'folder']),
    body('resourceId').isUUID(),
    body('granteeUserId').isUUID(),
    body('role').isIn(['viewer', 'editor'])
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

      const { resourceType, resourceId, granteeUserId, role } = req.body
      const userId = req.user!.id

      // Verify resource exists and user owns it
      const table = resourceType === 'file' ? 'files' : 'folders'
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', resourceId)
        .eq('is_deleted', false)
        .single()

      if (resourceError || !resource) {
        throw createError(404, 'RESOURCE_NOT_FOUND', `${resourceType} not found`)
      }

      if (resource.owner_id !== userId) {
        throw createError(403, 'FORBIDDEN', 'Only resource owner can share')
      }

      // Verify grantee user exists
      const { data: granteeUser, error: granteeError } = await supabase
        .from('users')
        .select('id')
        .eq('id', granteeUserId)
        .single()

      if (granteeError || !granteeUser) {
        throw createError(404, 'USER_NOT_FOUND', 'Grantee user not found')
      }

      // Check if share already exists
      const { data: existingShare } = await supabase
        .from('shares')
        .select('id')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .eq('grantee_user_id', granteeUserId)
        .single()

      if (existingShare) {
        // Update existing share
        const { data: updatedShare, error: updateError } = await supabase
          .from('shares')
          .update({ role })
          .eq('id', existingShare.id)
          .select()
          .single()

        if (updateError) {
          throw createError(500, 'UPDATE_FAILED', 'Failed to update share')
        }

        return res.json({
          share: updatedShare,
          message: 'Share updated successfully'
        })
      }

      // Create new share
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .insert({
          resource_type: resourceType,
          resource_id: resourceId,
          grantee_user_id: granteeUserId,
          role,
          created_by: userId
        })
        .select()
        .single()

      if (shareError) {
        throw createError(500, 'CREATE_FAILED', 'Failed to create share')
      }

      res.status(201).json({
        share,
        message: 'Share created successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get shares for a resource
router.get('/:resourceType/:resourceId',
  [
    param('resourceType').isIn(['file', 'folder']),
    param('resourceId').isUUID()
  ],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters'
          }
        })
      }

      const { resourceType, resourceId } = req.params
      const userId = req.user!.id

      // Verify resource exists and user owns it
      const table = resourceType === 'file' ? 'files' : 'folders'
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', resourceId)
        .eq('is_deleted', false)
        .single()

      if (resourceError || !resource) {
        throw createError(404, 'RESOURCE_NOT_FOUND', `${resourceType} not found`)
      }

      if (resource.owner_id !== userId) {
        throw createError(403, 'FORBIDDEN', 'Only resource owner can view shares')
      }

      // Get user shares
      const { data: userShares, error: userSharesError } = await supabase
        .from('shares')
        .select(`
          id,
          role,
          created_at,
          grantee_user_id
        `)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)

      if (userSharesError) {
        throw createError(500, 'FETCH_FAILED', 'Failed to fetch user shares')
      }

      // Get user shares with user details
      const userSharesWithUsers = await Promise.all(
        (userShares || []).map(async (share) => {
          const { data: user } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', share.grantee_user_id)
            .single()

          return {
            ...share,
            user: user || { id: share.grantee_user_id, email: 'Unknown', name: 'Unknown' }
          }
        })
      )

      // Get link shares
      const { data: linkShares, error: linkSharesError } = await supabase
        .from('link_shares')
        .select('id, token, role, expires_at, password_hash, created_at')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)

      if (linkSharesError) {
        throw createError(500, 'FETCH_FAILED', 'Failed to fetch link shares')
      }

      res.json({
        userShares: userSharesWithUsers,
        linkShares: (linkShares || []).map(share => ({
          ...share,
          hasPassword: !!share.password_hash,
          password_hash: undefined // Don't expose hash
        }))
      })
    } catch (error) {
      next(error)
    }
  }
)

// Delete user share
router.delete('/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid share ID'
          }
        })
      }

      const shareId = req.params.id
      const userId = req.user!.id

      // Get share details
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', shareId)
        .single()

      if (shareError || !share) {
        throw createError(404, 'SHARE_NOT_FOUND', 'Share not found')
      }

      // Verify user owns the resource
      const table = share.resource_type === 'file' ? 'files' : 'folders'
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', share.resource_id)
        .single()

      if (resourceError || !resource || resource.owner_id !== userId) {
        throw createError(403, 'FORBIDDEN', 'Only resource owner can delete shares')
      }

      // Delete share
      const { error: deleteError } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId)

      if (deleteError) {
        throw createError(500, 'DELETE_FAILED', 'Failed to delete share')
      }

      res.json({
        message: 'Share deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// Create public link share
router.post('/links',
  [
    body('resourceType').isIn(['file', 'folder']),
    body('resourceId').isUUID(),
    body('expiresAt').optional().isISO8601(),
    body('password').optional().isString().isLength({ min: 4 })
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

      const { resourceType, resourceId, expiresAt, password } = req.body
      const userId = req.user!.id

      // Verify resource exists and user owns it
      const table = resourceType === 'file' ? 'files' : 'folders'
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', resourceId)
        .eq('is_deleted', false)
        .single()

      if (resourceError || !resource) {
        throw createError(404, 'RESOURCE_NOT_FOUND', `${resourceType} not found`)
      }

      if (resource.owner_id !== userId) {
        throw createError(403, 'FORBIDDEN', 'Only resource owner can create public links')
      }

      // Generate secure token
      const token = uuidv4() + uuidv4().replace(/-/g, '')

      // Hash password if provided
      let passwordHash = null
      if (password) {
        passwordHash = await bcrypt.hash(password, 12)
      }

      // Create link share
      const { data: linkShare, error: linkError } = await supabase
        .from('link_shares')
        .insert({
          resource_type: resourceType,
          resource_id: resourceId,
          token,
          role: 'viewer',
          password_hash: passwordHash,
          expires_at: expiresAt || null,
          created_by: userId
        })
        .select()
        .single()

      if (linkError) {
        throw createError(500, 'CREATE_FAILED', 'Failed to create public link')
      }

      res.status(201).json({
        linkShare: {
          ...linkShare,
          hasPassword: !!passwordHash,
          password_hash: undefined // Don't expose hash
        },
        publicUrl: `${process.env.FRONTEND_URL}/link/${token}`,
        message: 'Public link created successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// Delete public link share
router.delete('/links/:id',
  [param('id').isUUID()],
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid link share ID'
          }
        })
      }

      const linkShareId = req.params.id
      const userId = req.user!.id

      // Get link share details
      const { data: linkShare, error: linkError } = await supabase
        .from('link_shares')
        .select('*')
        .eq('id', linkShareId)
        .single()

      if (linkError || !linkShare) {
        throw createError(404, 'LINK_NOT_FOUND', 'Public link not found')
      }

      // Verify user owns the resource
      const table = linkShare.resource_type === 'file' ? 'files' : 'folders'
      const { data: resource, error: resourceError } = await supabase
        .from(table)
        .select('owner_id')
        .eq('id', linkShare.resource_id)
        .single()

      if (resourceError || !resource || resource.owner_id !== userId) {
        throw createError(403, 'FORBIDDEN', 'Only resource owner can delete public links')
      }

      // Delete link share
      const { error: deleteError } = await supabase
        .from('link_shares')
        .delete()
        .eq('id', linkShareId)

      if (deleteError) {
        throw createError(500, 'DELETE_FAILED', 'Failed to delete public link')
      }

      res.json({
        message: 'Public link deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router