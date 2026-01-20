import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          image_url?: string | null
          created_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          owner_id: string
          parent_id: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          parent_id?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          parent_id?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          mime_type: string
          size_bytes: number
          storage_key: string
          owner_id: string
          folder_id: string | null
          version_id: string | null
          checksum: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          mime_type: string
          size_bytes: number
          storage_key: string
          owner_id: string
          folder_id?: string | null
          version_id?: string | null
          checksum?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mime_type?: string
          size_bytes?: number
          storage_key?: string
          owner_id?: string
          folder_id?: string | null
          version_id?: string | null
          checksum?: string | null
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          resource_type: 'file' | 'folder'
          resource_id: string
          grantee_user_id: string
          role: 'viewer' | 'editor'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          resource_type: 'file' | 'folder'
          resource_id: string
          grantee_user_id: string
          role: 'viewer' | 'editor'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          resource_type?: 'file' | 'folder'
          resource_id?: string
          grantee_user_id?: string
          role?: 'viewer' | 'editor'
          created_by?: string
          created_at?: string
        }
      }
      link_shares: {
        Row: {
          id: string
          resource_type: 'file' | 'folder'
          resource_id: string
          token: string
          role: 'viewer'
          password_hash: string | null
          expires_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          resource_type: 'file' | 'folder'
          resource_id: string
          token: string
          role?: 'viewer'
          password_hash?: string | null
          expires_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          resource_type?: 'file' | 'folder'
          resource_id?: string
          token?: string
          role?: 'viewer'
          password_hash?: string | null
          expires_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      stars: {
        Row: {
          user_id: string
          resource_type: 'file' | 'folder'
          resource_id: string
        }
        Insert: {
          user_id: string
          resource_type: 'file' | 'folder'
          resource_id: string
        }
        Update: {
          user_id?: string
          resource_type?: 'file' | 'folder'
          resource_id?: string
        }
      }
    }
  }
}