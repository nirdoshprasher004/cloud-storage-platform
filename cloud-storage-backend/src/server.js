const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Middleware - Custom CORS handler for better compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3004',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL
  ].filter(Boolean); // Remove undefined values
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Initialize Supabase with service role (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Also create a regular client for auth operations
const supabase = supabaseAdmin;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// CORS preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Test user authentication
app.get('/api/test-auth', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('Testing token:', token.substring(0, 20) + '...');

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('Token validation failed:', userError?.message);
      return res.status(401).json({ error: 'Invalid token', details: userError?.message });
    }

    console.log('Token validation successful for user:', user.id);
    res.json({ 
      message: 'Authentication successful!',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create test user (bypasses email confirmation)
app.post('/api/auth/create-test-user', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Use service role to create user directly
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // This bypasses email confirmation
    });

    if (authError) throw authError;

    // Create user record
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name
      });

    res.status(201).json({
      message: 'Test user created successfully (email confirmed)',
      user: { id: authData.user.id, email, name }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fix user record endpoint (for frontend to call)
app.post('/api/auth/sync-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Syncing user record for:', user.id, user.email);

    // Force create user record by disabling RLS temporarily for this operation
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0]
      }, {
        onConflict: 'id'
      });
    
    if (insertError) {
      console.error('Failed to sync user record:', insertError);
      return res.status(400).json({ error: 'Failed to sync user record', details: insertError.message });
    }
    
    console.log('User record synced successfully');
    res.json({ 
      message: 'User record synced successfully', 
      user: { id: user.id, email: user.email } 
    });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Fix user record endpoint
app.post('/api/auth/fix-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      console.log('Creating missing user record for:', user.id);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0]
        });
      
      if (insertError) {
        console.error('Failed to create user record:', insertError);
        return res.status(400).json({ error: 'Failed to create user record' });
      }
      
      res.json({ message: 'User record created successfully', user: { id: user.id, email: user.email } });
    } else {
      res.json({ message: 'User record already exists', user: existingUser });
    }
  } catch (error) {
    console.error('Fix user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend server is running!'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) throw error;
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    console.log('Registration attempt for:', email);
    
    // For now, use service role for auth operations (temporary fix)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // This bypasses email confirmation
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created successfully:', authData.user.id);

    // Create user record using service role for admin operations
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    res.status(201).json({
      message: 'User registered successfully (email confirmed)',
      user: { id: authData.user.id, email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Use service role to sign in user (temporary fix)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    console.log('Login successful for user:', data.user.id);

    // Ensure user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!existingUser) {
      console.log('User not found in users table, creating...');
      
      // Use service role with explicit RLS bypass
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email.split('@')[0]
        });
      
      if (insertError && insertError.code === '42501') {
        // RLS policy violation - try to create via direct SQL
        console.log('RLS blocking user creation, attempting direct insert...');
        
        const { error: directError } = await supabase
          .rpc('exec_sql', {
            sql: `INSERT INTO users (id, email, name) VALUES ('${data.user.id}', '${data.user.email}', '${data.user.user_metadata?.name || data.user.email.split('@')[0]}') ON CONFLICT (id) DO NOTHING;`
          });
        
        if (directError) {
          console.error('Direct SQL insert failed:', directError);
          // Continue anyway - we'll handle the foreign key error in folder creation
        } else {
          console.log('User record created via direct SQL');
        }
      } else if (insertError) {
        console.error('Failed to create user record:', insertError);
      } else {
        console.log('User record created successfully');
      }
    }

    // Get user data from our users table to include name
    const { data: userRecord } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userData = userRecord || {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email.split('@')[0]
    };

    res.json({
      message: 'Login successful',
      user: userData,
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({ user: userData || user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/files/upload', upload.array('files'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('File upload token validation failed:', userError?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { folderId } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileId = uuidv4();
      const fileExtension = file.originalname.split('.').pop() || '';
      let storageKey = `${user.id}/${fileId}.${fileExtension}`;

      // Upload to Supabase Storage using service role with proper configuration
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(storageKey, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If it's an RLS error, try with a different storage path or method
        if (uploadError.message && uploadError.message.includes('row-level security')) {
          console.log('Storage RLS error detected, trying alternative approach...');
          
          // Try uploading to a public path or with different settings
          const publicStorageKey = `public/${user.id}/${fileId}.${fileExtension}`;
          const { data: publicUploadData, error: publicUploadError } = await supabase.storage
            .from('files')
            .upload(publicStorageKey, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });
          
          if (publicUploadError) {
            console.error('Public upload also failed:', publicUploadError);
            continue;
          } else {
            console.log('Public upload successful, updating storage key');
            storageKey = publicStorageKey;
          }
        } else {
          continue;
        }
      }

      // Save file metadata to database using service role
      const { data: fileData, error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          name: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size,
          storage_key: storageKey,
          owner_id: user.id,
          folder_id: folderId || null
        })
        .select()
        .single();

      if (!dbError) {
        uploadedFiles.push(fileData);
      } else {
        console.error('Database error:', dbError);
      }
    }

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Download file
app.get('/api/files/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get file metadata using service role
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get signed URL for download using service role
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('files')
      .createSignedUrl(file.storage_key, 3600); // 1 hour expiry

    if (urlError) {
      return res.status(500).json({ error: 'Failed to generate download URL' });
    }

    res.json({
      downloadUrl: signedUrlData.signedUrl,
      filename: file.name,
      size: file.size_bytes,
      mimeType: file.mime_type
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { error } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create folder
app.post('/api/folders', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    console.log('Creating folder for user:', user.id);
    
    // Use service role client to bypass RLS - first ensure user exists
    try {
      const { error: userUpsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        }, {
          onConflict: 'id'
        });
      
      if (userUpsertError) {
        console.log('User upsert warning (may be expected):', userUpsertError.message);
      } else {
        console.log('User record ensured');
      }
    } catch (userErr) {
      console.log('User creation attempt completed with potential RLS bypass');
    }
    
    // Create the folder using service role (should bypass RLS)
    const { data, error } = await supabase
      .from('folders')
      .insert({
        name,
        owner_id: user.id,
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Folder creation error:', error);
      
      // If still getting RLS error, try using raw SQL
      if (error.code === '42501') {
        console.log('RLS still blocking, attempting raw SQL approach...');
        
        try {
          // Use Supabase's SQL execution capability
          const folderIdQuery = `
            INSERT INTO folders (name, owner_id, parent_id) 
            VALUES ('${name.replace(/'/g, "''")}', '${user.id}', ${parentId ? `'${parentId}'` : 'NULL'})
            RETURNING *;
          `;
          
          const { data: sqlData, error: sqlError } = await supabase
            .rpc('exec_sql', { sql: folderIdQuery });
          
          if (sqlError) {
            console.error('SQL execution failed:', sqlError);
            throw error; // Fall back to original error
          }
          
          console.log('Folder created via raw SQL');
          return res.status(201).json({ folder: sqlData[0] });
        } catch (sqlErr) {
          console.error('Raw SQL approach failed:', sqlErr);
          throw error; // Fall back to original error
        }
      }
      
      throw error;
    }
    
    console.log('Folder created successfully:', data.id);
    res.status(201).json({ folder: data });
    
  } catch (error) {
    console.error('Folder creation error:', error);
    res.status(400).json({ 
      error: error.message,
      details: 'Folder creation failed. This may be due to database permissions.',
      suggestion: 'Please ensure your account is properly set up.'
    });
  }
});

// Get folder contents (root if no ID provided)
app.get('/api/folders/:id?', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.log('Token validation failed:', userError?.message || 'No user found');
      return res.status(401).json({ error: 'Invalid token', details: userError?.message });
    }
    
    console.log('User authenticated successfully:', user.id);
    
    let folder = null;
    if (id && id !== 'root') {
      const { data: folderData } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .eq('is_deleted', false)
        .single();
      folder = folderData;
    }

    // Get subfolders using service role
    let subfoldersQuery = supabase
      .from('folders')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .order('name');
    
    if (id === 'root') {
      subfoldersQuery = subfoldersQuery.is('parent_id', null);
    } else {
      subfoldersQuery = subfoldersQuery.eq('parent_id', id);
    }
    
    const { data: subfolders } = await subfoldersQuery;

    // Get files using service role
    let filesQuery = supabase
      .from('files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .order('name');
    
    if (id === 'root') {
      filesQuery = filesQuery.is('folder_id', null);
    } else {
      filesQuery = filesQuery.eq('folder_id', id);
    }
    
    const { data: files } = await filesQuery;

    res.json({
      folder,
      children: {
        folders: subfolders || [],
        files: files || []
      }
    });
  } catch (error) {
    console.error('Folder contents error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete folder
app.delete('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { error } = await supabase
      .from('folders')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) throw error;
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rename folder
app.patch('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data, error } = await supabase
      .from('folders')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ folder: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rename file
app.patch('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data, error } = await supabase
      .from('files')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ file: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get starred items
app.get('/api/starred', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data: stars } = await supabase
      .from('stars')
      .select('*')
      .eq('user_id', user.id);

    // Get starred folders
    const folderIds = stars?.filter(s => s.resource_type === 'folder').map(s => s.resource_id) || [];
    const { data: folders } = folderIds.length > 0 ? await supabase
      .from('folders')
      .select('*')
      .in('id', folderIds)
      .eq('is_deleted', false)
      .eq('owner_id', user.id) : { data: [] };

    // Get starred files
    const fileIds = stars?.filter(s => s.resource_type === 'file').map(s => s.resource_id) || [];
    const { data: files } = fileIds.length > 0 ? await supabase
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('is_deleted', false)
      .eq('owner_id', user.id) : { data: [] };

    res.json({
      folders: folders || [],
      files: files || []
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle star
app.post('/api/stars', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if already starred
    const { data: existing } = await supabase
      .from('stars')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .single();

    if (existing) {
      // Remove star
      await supabase
        .from('stars')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);
      res.json({ starred: false });
    } else {
      // Add star
      await supabase
        .from('stars')
        .insert({
          user_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId
        });
      res.json({ starred: true });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recent files
app.get('/api/recent', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('is_deleted', false)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    res.json({ files: files || [] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get trash items
app.get('/api/trash', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data: folders } = await supabase
      .from('folders')
      .select('*')
      .eq('is_deleted', true)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('is_deleted', true)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    res.json({
      folders: folders || [],
      files: files || []
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token (since login uses service role)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (!q) {
      return res.json({ folders: [], files: [] });
    }

    const { data: folders } = await supabase
      .from('folders')
      .select('*')
      .eq('is_deleted', false)
      .eq('owner_id', user.id)
      .ilike('name', `%${q}%`)
      .order('name');

    const { data: files } = await supabase
      .from('files')
      .select('*')
      .eq('is_deleted', false)
      .eq('owner_id', user.id)
      .ilike('name', `%${q}%`)
      .order('name');

    res.json({
      folders: folders || [],
      files: files || []
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Share endpoints

// Create a user-to-user share
app.post('/api/shares', async (req, res) => {
  try {
    const { resourceType, resourceId, granteeEmail, role } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find the grantee user by email
    const { data: granteeUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', granteeEmail)
      .single();

    if (!granteeUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the share
    const { data, error } = await supabase
      .from('shares')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        grantee_user_id: granteeUser.id,
        role: role || 'viewer',
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ share: data });
  } catch (error) {
    console.error('Share creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create a public link share
app.post('/api/link-shares', async (req, res) => {
  try {
    const { resourceType, resourceId, password, expiresAt } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate a unique token for the share
    const shareToken = require('crypto').randomBytes(32).toString('hex');
    
    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Create the link share
    const { data, error } = await supabase
      .from('link_shares')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        token: shareToken,
        role: 'viewer',
        password_hash: passwordHash,
        expires_at: expiresAt || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareToken}`;
    
    res.status(201).json({ 
      share: data,
      shareUrl: shareUrl
    });
  } catch (error) {
    console.error('Link share creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get shares for a resource
app.get('/api/shares/:resourceType/:resourceId', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user-to-user shares
    const { data: userShares } = await supabase
      .from('shares')
      .select(`
        *,
        grantee:users!shares_grantee_user_id_fkey(email, name)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('created_by', user.id);

    // Get link shares
    const { data: linkShares } = await supabase
      .from('link_shares')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('created_by', user.id);

    res.json({
      userShares: userShares || [],
      linkShares: linkShares || []
    });
  } catch (error) {
    console.error('Get shares error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a share
app.delete('/api/shares/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
    res.json({ message: 'Share deleted successfully' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a link share
app.delete('/api/link-shares/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { error } = await supabase
      .from('link_shares')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id);

    if (error) throw error;
    res.json({ message: 'Link share deleted successfully' });
  } catch (error) {
    console.error('Delete link share error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Access a public link share
app.get('/api/public-share/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    // Get the link share
    const { data: linkShare } = await supabase
      .from('link_shares')
      .select('*')
      .eq('token', token)
      .single();

    if (!linkShare) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Check if expired
    if (linkShare.expires_at && new Date(linkShare.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share has expired' });
    }

    // Check password if required
    if (linkShare.password_hash && !password) {
      return res.status(401).json({ error: 'Password required' });
    }

    if (linkShare.password_hash && password) {
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, linkShare.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get the resource
    let resource = null;
    if (linkShare.resource_type === 'file') {
      const { data: file } = await supabase
        .from('files')
        .select('*')
        .eq('id', linkShare.resource_id)
        .eq('is_deleted', false)
        .single();
      resource = file;
    } else if (linkShare.resource_type === 'folder') {
      const { data: folder } = await supabase
        .from('folders')
        .select('*')
        .eq('id', linkShare.resource_id)
        .eq('is_deleted', false)
        .single();
      resource = folder;
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      share: linkShare,
      resource: resource
    });
  } catch (error) {
    console.error('Public share access error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CloudDrive Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      files: '/api/files/*',
      folders: '/api/folders/*',
      shares: '/api/shares/*'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🗄️ Test DB: http://localhost:${PORT}/api/test-db`);
  console.log(`📁 File Upload: POST ${PORT}/api/files/upload`);
});

// Admin API endpoints
app.get('/api/admin/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Use service role to validate token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total files
    const { count: totalFiles } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get total folders
    const { count: totalFolders } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get total shares (user shares + link shares)
    const { count: userShares } = await supabase
      .from('shares')
      .select('*', { count: 'exact', head: true });

    const { count: linkShares } = await supabase
      .from('link_shares')
      .select('*', { count: 'exact', head: true });

    // Get total storage used
    const { data: storageData } = await supabase
      .from('files')
      .select('size_bytes')
      .eq('is_deleted', false);

    const totalStorage = storageData?.reduce((sum, file) => sum + (file.size_bytes || 0), 0) || 0;

    // Get active users (users who have files or folders)
    const { data: activeUsersData } = await supabase
      .from('users')
      .select('id')
      .or('id.in.(select distinct owner_id from files where is_deleted = false),id.in.(select distinct owner_id from folders where is_deleted = false)');

    const activeUsers = activeUsersData?.length || 0;

    res.json({
      totalUsers: totalUsers || 0,
      totalFiles: totalFiles || 0,
      totalFolders: totalFolders || 0,
      totalShares: (userShares || 0) + (linkShares || 0),
      totalStorage,
      activeUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users for admin
app.get('/api/admin/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: users } = await supabase
      .from('users')
      .select(`
        *,
        files:files(count),
        folders:folders(count),
        shares_created:shares!shares_created_by_fkey(count)
      `)
      .order('created_at', { ascending: false });

    res.json({ users: users || [] });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activities for admin
app.get('/api/admin/activities', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: activities } = await supabase
      .from('activities')
      .select(`
        *,
        actor:users!activities_actor_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ activities: activities || [] });
  } catch (error) {
    console.error('Admin activities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage analytics for admin
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: dailyFiles } = await supabase
      .from('files')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('is_deleted', false);

    const { data: dailyUsers } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Group by date
    const analytics = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const filesCount = dailyFiles?.filter(f => 
        f.created_at.startsWith(dateStr)
      ).length || 0;
      
      const usersCount = dailyUsers?.filter(u => 
        u.created_at.startsWith(dateStr)
      ).length || 0;

      analytics.push({
        date: dateStr,
        users: usersCount,
        files: filesCount,
        storage: filesCount * 1.5 // Approximate storage in MB
      });
    }

    res.json({ analytics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all user shares for admin
app.get('/api/admin/shares/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: shares } = await supabase
      .from('shares')
      .select(`
        *,
        grantee:users!shares_grantee_user_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false });

    res.json({ shares: shares || [] });
  } catch (error) {
    console.error('Admin user shares error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all link shares for admin
app.get('/api/admin/shares/link', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: shares } = await supabase
      .from('link_shares')
      .select('*')
      .order('created_at', { ascending: false });

    res.json({ shares: shares || [] });
  } catch (error) {
    console.error('Admin link shares error:', error);
    res.status(500).json({ error: error.message });
  }
});