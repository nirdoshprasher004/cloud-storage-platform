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
    loadFolderContents()
  }, [currentFolder])

  const loadFolderContents = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/auth'
        return
      }

      const response = await fetch(`http://localhost:3003/api/folders/${currentFolder}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const allItems: FileItem[] = [
          ...data.children.folders.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            modifiedAt: folder.updated_at,
            owner: 'You',
            isStarred: false,
            isShared: false
          })),
          ...data.children.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            type: 'file' as const,
            size: file.size_bytes,
            mimeType: file.mime_type,
            modifiedAt: file.updated_at,
            owner: 'You',
            isStarred: false,
            isShared: false
          }))
        ]
        setItems(allItems)
      } else if (response.status === 401) {
        localStorage.removeItem('access_token')
        window.location.href = '/auth'
      }
    } catch (error) {
      console.error('Error loading folder contents:', error)
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
    const token = localStorage.getItem('access_token')
    
    switch (action) {
      case 'star':
        try {
          await fetch('http://localhost:3003/api/stars', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              resourceType: item.type,
              resourceId: item.id
            })
          })
          loadFolderContents() // Refresh
        } catch (error) {
          console.error('Error starring item:', error)
        }
        break
      
      case 'delete':
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
          try {
            const endpoint = item.type === 'folder' ? 'folders' : 'files'
            await fetch(`http://localhost:3003/api/${endpoint}/${item.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            loadFolderContents() // Refresh
          } catch (error) {
            console.error('Error deleting item:', error)
          }
        }
        break
      
      case 'rename':
        const newName = prompt('Enter new name:', item.name)
        if (newName && newName !== item.name) {
          try {
            const endpoint = item.type === 'folder' ? 'folders' : 'files'
            await fetch(`http://localhost:3003/api/${endpoint}/${item.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ name: newName })
            })
            loadFolderContents() // Refresh
          } catch (error) {
            console.error('Error renaming item:', error)
          }
        }
        break
      
      case 'download':
        if (item.type === 'file') {
          try {
            const response = await fetch(`http://localhost:3003/api/files/${item.id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              // Create a temporary link to download the file
              const link = document.createElement('a')
              link.href = data.downloadUrl
              link.download = data.filename
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          } catch (error) {
            console.error('Error downloading file:', error)
          }
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

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:3003/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolder === 'root' ? null : currentFolder
        })
      })

      if (response.ok) {
        setNewFolderName('')
        setShowNewFolder(false)
        loadFolderContents() // Refresh
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const handleFileUpload = (files: FileList) => {
    const uploadFiles = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const formData = new FormData()
        
        Array.from(files).forEach(file => {
          formData.append('files', file)
        })
        
        formData.append('folderId', currentFolder === 'root' ? '' : currentFolder)
        
        const response = await fetch('http://localhost:3003/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          alert(`${result.files.length} files uploaded successfully!`)
          loadFolderContents() // Refresh
        } else {
          const error = await response.json()
          alert(`Upload failed: ${error.error}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Upload failed. Please try again.')
      }
    }
    uploadFiles()
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

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:3003/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceType: shareItem.type,
          resourceId: shareItem.id,
          granteeEmail: shareEmail,
          role: 'viewer'
        })
      })

      if (response.ok) {
        alert(`Successfully shared "${shareItem.name}" with ${shareEmail}`)
        setShareEmail('')
        setShowShareModal(false)
      } else {
        const error = await response.json()
        alert(`Share failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating share:', error)
      alert('Share failed. Please try again.')
    }
  }

  const createLinkShare = async () => {
    if (!shareItem) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:3003/api/link-shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceType: shareItem.type,
          resourceId: shareItem.id,
          password: sharePassword || null,
          expiresAt: shareExpiry || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        navigator.clipboard.writeText(result.shareUrl)
        alert(`Share link created and copied to clipboard!\n\nLink: ${result.shareUrl}`)
        setSharePassword('')
        setShareExpiry('')
        setShowShareModal(false)
      } else {
        const error = await response.json()
        alert(`Link share failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating link share:', error)
      alert('Link share failed. Please try again.')
    }
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