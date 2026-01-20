'use client'

import { useEffect, useState } from 'react'
import { AdminAPI } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatFileSize } from '@/lib/utils'
import { FileIcon, FolderIcon, UsersIcon, DownloadIcon, RefreshCwIcon, HardDriveIcon, DatabaseIcon } from 'lucide-react'

interface FileData {
  id: string
  name: string
  mime_type: string
  size_bytes: number
  created_at: string
  owner: {
    name: string
    email: string
  }
}

export default function FilesPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileData[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadFilesAndFolders()
    }
  }, [user])

  const loadFilesAndFolders = async () => {
    try {
      setLoading(true)
      
      // Get all files and folders from the root endpoint
      const response = await fetch('http://localhost:3003/api/folders/root', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.children.files || [])
        setFolders(data.children.folders || [])
      }
    } catch (error) {
      console.error('Error loading files and folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFilesAndFolders()
    setRefreshing(false)
  }

  const totalStorage = files.reduce((sum, file) => sum + file.size_bytes, 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 animate-fade-in">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-56 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg skeleton" />
            <div className="h-4 w-96 bg-gradient-to-r from-slate-200 to-slate-300 rounded skeleton" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl skeleton" />
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl skeleton" />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">
              Files & Folders
            </h1>
            <p className="text-slate-700 text-lg">Manage all files and folders on the platform</p>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Files</CardTitle>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{files.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                {formatFileSize(totalStorage)} total storage
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Folders</CardTitle>
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <FolderIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{folders.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                Organized storage structure
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Storage Used</CardTitle>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <HardDriveIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{formatFileSize(totalStorage)}</div>
              <p className="text-xs text-slate-600 mt-1">
                Across all files
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-900">Folders ({folders.length})</h2>
            </div>
            
            <div className="grid gap-4">
              {folders.map((folder) => (
                <Card key={folder.id} className="hover-lift transition-all duration-300">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <FolderIcon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">{folder.name}</div>
                        <div className="text-sm text-slate-600 flex items-center gap-4">
                          <span>Created {formatDate(folder.created_at)}</span>
                          <span>•</span>
                          <span>Owner: {folder.owner?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DatabaseIcon className="h-4 w-4" />
                      <span>Folder</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Files Section */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Files ({files.length})</h2>
            </div>
            
            <div className="grid gap-4">
              {files.map((file) => (
                <Card key={file.id} className="hover-lift transition-all duration-300">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">{file.name}</div>
                        <div className="text-sm text-slate-600 flex items-center gap-4">
                          <span className="font-medium">{formatFileSize(file.size_bytes)}</span>
                          <span>•</span>
                          <span>{file.mime_type}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(file.created_at)}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Owner: {file.owner?.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-700">{formatFileSize(file.size_bytes)}</div>
                        <div className="text-xs text-slate-600">File size</div>
                      </div>
                      <Button variant="outline" size="sm" className="hover:bg-blue-50">
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {files.length === 0 && folders.length === 0 && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No files or folders found</h3>
              <p className="text-slate-600">Files and folders will appear here once users start uploading content.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}