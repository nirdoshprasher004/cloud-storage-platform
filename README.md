# Cloud-Based Media Files Storage Service

A comprehensive file storage and sharing platform with three separate applications:

## Project Structure

```
├── cloud-storage-frontend/     # Next.js React frontend
├── cloud-storage-backend/      # Node.js/Express API server
├── cloud-storage-admin/        # Admin dashboard
├── database-schema-safe.sql    # Database schema
└── README.md                   # This file
```

## Architecture Overview

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS, TanStack Query
- **Backend**: Node.js + Express.js REST API with PostgreSQL (Supabase)
- **Storage**: Supabase Storage with CDN
- **Auth**: Supabase Auth with JWT tokens
- **Admin**: Separate admin panel for platform management

## Quick Setup

### 1. Environment Configuration

Each application requires environment variables. Copy the example files and configure them:

**Backend** (`cloud-storage-backend/.env`):
```bash
cp cloud-storage-backend/.env.example cloud-storage-backend/.env
```

**Frontend** (`cloud-storage-frontend/.env.local`):
```bash
cp cloud-storage-frontend/.env.local.example cloud-storage-frontend/.env.local
```

**Admin** (`cloud-storage-admin/.env.local`):
```bash
cp cloud-storage-admin/.env.local.example cloud-storage-admin/.env.local
```

### 2. Required Environment Variables

You'll need to configure these variables in each `.env` file:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (backend only)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (frontend/admin)

### 3. Database Setup

1. Create a Supabase project
2. Run the SQL schema: `database-schema-safe.sql`
3. Configure Row Level Security (RLS) policies
4. Set up Storage bucket named `files`

### 4. Install Dependencies & Start Services

```bash
# Backend (Port 3003)
cd cloud-storage-backend
npm install
npm run dev

# Frontend (Port 3001)
cd cloud-storage-frontend
npm install
npm run dev

# Admin (Port 3000)
cd cloud-storage-admin
npm install
npm run dev
```

### 5. Access Applications

- **Frontend**: http://localhost:3001
- **Admin Panel**: http://localhost:3000
- **Backend API**: http://localhost:3003

### 6. Admin Credentials

Default admin login:
- **Email**: nirdoshprasher@gmail.com
- **Password**: Nirdo#h#01

## Features

### Core MVP Features
- Email/OAuth authentication and sessions
- Hierarchical folder structure with CRUD operations
- File upload/download with drag & drop support
- Granular sharing (Viewer/Editor roles)
- Public share links with expiry and password protection
- Search and filtering capabilities
- Starred/Favorites system
- Trash with restore functionality

### Admin Features
- User management and monitoring
- File and folder management
- Activity logs and analytics
- Share management
- System settings and configuration

### Phase 2 Features
- File versioning
- File previews and thumbnails
- Advanced search with content indexing
- Tags and bulk operations

## Development

Each application has its own development environment. See individual README files in each directory for detailed setup instructions and development guidelines.

## Production Deployment

### Quick Deploy

**Backend (Render)**:
1. Connect GitHub repo to Render
2. Select `cloud-storage-backend` directory
3. Set environment variables (see DEPLOYMENT.md)
4. Deploy

**Frontend & Admin (Vercel)**:
1. Connect GitHub repo to Vercel
2. Create two projects: `cloud-storage-frontend` and `cloud-storage-admin`
3. Set environment variables for each
4. Deploy

### Deployment URLs
- **Frontend**: `https://your-frontend.vercel.app`
- **Admin**: `https://your-admin.vercel.app`  
- **Backend**: `https://your-backend.onrender.com`

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Production Deployment

For production deployment, ensure:
1. Environment variables are properly configured
2. Database is set up with proper security
3. CORS is configured for your domains
4. SSL certificates are in place
5. File storage permissions are correctly set

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.