import express from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../lib/supabase'
import { createError } from '../middleware/errorHandler'

const router = express.Router()

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 1 })
  ],
  async (req, res, next) => {
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

      const { email, password, name } = req.body

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })

      if (authError) {
        throw createError(400, 'REGISTRATION_FAILED', authError.message)
      }

      if (!authData.user) {
        throw createError(400, 'REGISTRATION_FAILED', 'Failed to create user')
      }

      // Create user record in database
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // User was created in auth but not in database
        // In production, you might want to handle this more gracefully
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res, next) => {
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

      const { email, password } = req.body

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw createError(401, 'LOGIN_FAILED', 'Invalid credentials')
      }

      if (!data.user || !data.session) {
        throw createError(401, 'LOGIN_FAILED', 'Authentication failed')
      }

      // Get user details from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, image_url')
        .eq('id', data.user.id)
        .single()

      if (userError) {
        console.error('User lookup error:', userError)
      }

      res.json({
        message: 'Login successful',
        user: userData || {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || ''
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      throw createError(401, 'UNAUTHORIZED', 'Access token required')
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw createError(401, 'UNAUTHORIZED', 'Invalid token')
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, image_url, created_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw createError(404, 'USER_NOT_FOUND', 'User not found')
    }

    res.json({
      user: userData
    })
  } catch (error) {
    next(error)
  }
})

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      await supabase.auth.signOut()
    }

    res.json({
      message: 'Logout successful'
    })
  } catch (error) {
    next(error)
  }
})

export default router