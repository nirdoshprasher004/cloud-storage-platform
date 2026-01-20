'use client'

import { useState, useEffect } from 'react'
import { FileGrid } from '@/components/file-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, FolderPlusIcon, UploadIcon, HomeIcon, ChevronRightIcon } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mimeType?: string
  modifiedAt: string
  owner: string
  isStarred: boolean
  isShared: boolean
}

export default function DrivePage() {
  const [viewMode] = useState<'grid' | 'list'>('grid')
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [currentFolder, setCurrentFolder] = useState<string>('root')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareItem, setShareItem] = useState<FileItem | null>(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePassword, setSharePassword] = useState('')
  const [shareExpiry, setShareExpiry] = useState('')

  useEffect(() => {
    checkAuthAndLoadFiles()
  }, [currentFolder])

  const checkAuthAndLoadFiles = async () => {
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/auth'
        return
      }

      // For now, show some mock data since we're using Supabase auth only
      // In a full implementation, you'd fetch from Supabase database
      const mockItems: FileItem[] = [
        {
          id: '1',
          name: 'Documents',
          type: 'folder',
          modifiedAt: new Date().toISOString(),
          owner: 'You',
          isStarred: false,
          isShared: false
        },
        {
          id: '2',
          name: 'Welcome.pdf',
          type: 'file',
          size: 1024000,
          mimeType: 'application/pdf',
          modifiedAt: new Date().toISOString(),
          owner: 'You',
          isStarred: true,
          isShared: false
        }
      ]
      
      setItems(mockItems)
    } catch (error) {
      console.error('Error checking auth:', error)
      window.location.href = '/auth'
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id)
    } else {
      console.log('Open file:', item)
      // Handle file opening
    }
  }

  const handleItemAction = async (action: string, item: FileItem) => {
    switch (action) {
      case 'star':
        // Update local state for demo
        setItems(items.map(i => 
          i.id === item.id ? { ...i, isStarred: !i.isStarred } : i
        ))
        break
      
      case 'delete':
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
          // Remove from local state for demo
          setItems(items.filter(i => i.id !== item.id))
        }
        break
      
      case 'rename':
        const newName = prompt('Enter new name:', item.name)
        if (newName && newName !== item.name) {
          // Update local state for demo
          setItems(items.map(i => 
            i.id === item.id ? { ...i, name: newName } : i
          ))
        }
        break
      
      case 'download':
        if (item.type === 'file') {
          alert(`Download functionality will be available when backend is connected.`)
        }
        break
      
      case 'share':
        handleShare(item)
        break
      
      default:
        console.log('Action:', action, 'Item:', item)
    }
  }

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return

    // Create mock folder for demo
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name: newFolderName,
      type: 'folder',
      modifiedAt: new Date().toISOString(),
      owner: 'You',
      isStarred: false,
      isShared: false
    }

    setItems([...items, newFolder])
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleFileUpload = (files: FileList) => {
    // Create mock files for demo
    const newFiles: FileItem[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: 'file' as const,
      size: file.size,
      mimeType: file.type,
      modifiedAt: new Date().toISOString(),
      owner: 'You',
      isStarred: false,
      isShared: false
    }))

    setItems([...items, ...newFiles])
    alert(`${files.length} files uploaded successfully! (Demo mode - files are not actually stored)`)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleShare = (item: FileItem) => {
    setShareItem(item)
    setShowShareModal(true)
  }

  const createUserShare = async () => {
    if (!shareItem || !shareEmail.trim()) return

    alert(`Successfully shared "${shareItem.name}" with ${shareEmail} (Demo mode)`)
    setShareEmail('')
    setShowShareModal(false)
  }

  const createLinkShare = async () => {
    if (!shareItem) return

    const mockShareUrl = `https://your-app.vercel.app/share/${shareItem.id}`
    navigator.clipboard.writeText(mockShareUrl)
    alert(`Share link created and copied to clipboard!\n\nLink: ${mockShareUrl}\n\n(Demo mode - link is not functional)`)
    setSharePassword('')
    setShareExpiry('')
    setShowShareModal(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white border-2 border-gray-300 rounded-xl p-6 transition-all duration-300 hover:shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-bold text-black">Loading your files...</div>
          <div className="text-sm font-bold text-black">Please wait a moment</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`h-full transition-all duration-300 ${isDragOver ? 'bg-blue-500/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Breadcrumb and Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2" aria-label="Breadcrumb">
            <button 
              onClick={() => setCurrentFolder('root')}
              className="flex items-center gap-2 text-sm font-bold text-black hover:text-blue-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <HomeIcon className="h-4 w-4" />
              My Drive
            </button>
            {currentFolder !== 'root' && (
              <>
                <ChevronRightIcon className="h-4 w-4 text-black" />
                <span className="text-sm font-bold text-blue-600">Current Folder</span>
              </>
            )}
          </nav>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowNewFolder(true)}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg animate-pulse-hover"
            >
              <FolderPlusIcon className="h-4 w-4" />
              New Folder
            </Button>
            
            <Button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) handleFileUpload(files)
                }
                input.click()
              }}
              size="sm"
              variant="outline"
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/10"
            >
              <UploadIcon className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
        
        {/* New Folder Input */}
        {showNewFolder && (
          <div className="mt-4 flex items-center gap-3 animate-scale-in">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewFolder()}
              className="max-w-xs bg-white/20 backdrop-blur-sm border-white/20 focus:bg-white/10"
              autoFocus
            />
            <Button onClick={createNewFolder} size="sm" className="btn-gradient">
              Create
            </Button>
            <Button 
              onClick={() => {
                setShowNewFolder(false)
                setNewFolderName('')
              }} 
              size="sm" 
              variant="outline"
              className="bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
          <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <FolderPlusIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">This folder is empty</h3>
            <p className="text-gray-500 mb-6">
              Create a new folder or drag and drop files to get started
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => setShowNewFolder(true)}
                className="btn-gradient"
              >
                <FolderPlusIcon className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
              <Button 
                variant="outline"
                className="bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/10"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) handleFileUpload(files)
                  }
                  input.click()
                }}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <FileGrid
          items={items}
          viewMode={viewMode}
          onItemClick={handleItemClick}
          onItemAction={handleItemAction}
        />
      )}

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl text-center animate-scale-in">
            <UploadIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Drop files here</h3>
            <p className="text-gray-500">Release to upload your files</p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-xl font-semibold mb-4">Share "{shareItem.name}"</h3>
            
            {/* User Share */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Share with user</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={createUserShare} size="sm">
                  Share
                </Button>
              </div>
            </div>

            {/* Link Share */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Create share link</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Password (optional)"
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
                <Input
                  placeholder="Expiry date (optional)"
                  type="datetime-local"
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                />
                <Button onClick={createLinkShare} className="w-full">
                  Create Link
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setShowShareModal(false)
                  setShareItem(null)
                  setShareEmail('')
                  setSharePassword('')
                  setShareExpiry('')
                }} 
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}