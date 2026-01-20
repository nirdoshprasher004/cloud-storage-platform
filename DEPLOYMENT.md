# Deployment Guide

This guide covers deploying the CloudDrive platform using Vercel for frontend applications and Render for the backend API.

## Architecture

- **Frontend**: Deployed on Vercel (clouddrive-frontend.vercel.app)
- **Admin Panel**: Deployed on Vercel (clouddrive-admin.vercel.app)
- **Backend API**: Deployed on Render (clouddrive-backend.onrender.com)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage

## Prerequisites

1. **Supabase Project**: Set up and configured with database schema
2. **Vercel Account**: For frontend deployments
3. **Render Account**: For backend deployment
4. **GitHub Repository**: Code pushed to GitHub

## Backend Deployment (Render)

### 1. Prepare Backend for Deployment

The backend is already configured with:
- ✅ `render.yaml` configuration file
- ✅ Production-ready `package.json` scripts
- ✅ Environment variable support
- ✅ CORS configuration for production URLs

### 2. Deploy to Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `cloud-storage-backend` directory

2. **Configure Service**:
   - **Name**: `clouddrive-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   FRONTEND_URL=https://your-frontend.vercel.app
   ADMIN_URL=https://your-admin.vercel.app
   ```

4. **Deploy**: Click "Create Web Service"

### 3. Get Backend URL

After deployment, you'll get a URL like:
`https://clouddrive-backend.onrender.com`

## Frontend Deployment (Vercel)

### 1. Deploy Frontend

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `cloud-storage-frontend` directory

2. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `cloud-storage-frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

3. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```

4. **Deploy**: Click "Deploy"

### 2. Deploy Admin Panel

1. **Create New Project**:
   - In Vercel Dashboard, click "New Project"
   - Import the same GitHub repository
   - Select the `cloud-storage-admin` directory

2. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `cloud-storage-admin`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

3. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```

4. **Deploy**: Click "Deploy"

## Post-Deployment Configuration

### 1. Update Backend CORS

After getting your Vercel URLs, update the backend environment variables:

```
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
```

### 2. Update Supabase Settings

1. **Authentication**:
   - Add your Vercel URLs to "Site URL" and "Redirect URLs"
   - Frontend: `https://your-frontend.vercel.app`
   - Admin: `https://your-admin.vercel.app`

2. **Storage**:
   - Ensure RLS policies allow your backend URL
   - Update CORS settings if needed

### 3. Test Deployment

1. **Backend Health Check**:
   ```
   GET https://your-backend.onrender.com/health
   ```

2. **Frontend Access**:
   - Visit `https://your-frontend.vercel.app`
   - Test login and file operations

3. **Admin Access**:
   - Visit `https://your-admin.vercel.app`
   - Login with admin credentials

## Environment Variables Summary

### Backend (Render)
```env
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Admin (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured with production URLs
2. **Environment Variables**: Double-check all environment variables are set
3. **Supabase URLs**: Ensure authentication redirect URLs are updated
4. **Build Failures**: Check build logs for missing dependencies

### Monitoring

- **Render**: Monitor backend logs and performance
- **Vercel**: Monitor frontend deployments and analytics
- **Supabase**: Monitor database and storage usage

## Scaling Considerations

1. **Render**: Upgrade to paid plan for better performance
2. **Vercel**: Pro plan for team features and better performance
3. **Supabase**: Monitor usage and upgrade plan as needed
4. **CDN**: Consider adding CloudFlare for additional performance

## Security Checklist

- ✅ Environment variables properly configured
- ✅ CORS restricted to known domains
- ✅ Supabase RLS policies enabled
- ✅ JWT secrets are secure
- ✅ HTTPS enforced on all endpoints
- ✅ File upload limits configured
- ✅ Rate limiting enabled