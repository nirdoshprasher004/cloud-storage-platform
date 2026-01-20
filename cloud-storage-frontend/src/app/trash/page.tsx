'use client'

import { useState, useEffect } from 'react'
import { FileGrid } from '@/components/file-grid'
import { TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function TrashPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrashItems()
  }, [])

  const loadTrashItems = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/auth'
        return
      }

      const response = await fetch('http://localhost:3003/api/trash', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const allItems: FileItem[] = [
          ...data.folders.map((folder: any) => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            modifiedAt: folder.updated_at,
            owner: 'You',
            isStarred: false,
            isShared: false
          })),
          ...data.files.map((file: any) => ({
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
      }
    } catch (error) {
      console.error('Error loading trash items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FileItem) => {
    console.log('Trash item clicked:', item)
  }

  const handleItemAction = (action: string, item: FileItem) => {
    if (action === 'restore') {
      console.log('Restore item:', item)
      // TODO: Implement restore functionality
    } else if (action === 'delete-permanently') {
      if (confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
        console.log('Permanently delete item:', item)
        // TODO: Implement permanent delete
      }
    }
  }

  const emptyTrash = () => {
    if (confirm('Empty trash? All items will be permanently deleted. This cannot be undone.')) {
      console.log('Empty trash')
      // TODO: Implement empty trash
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg">Loading trash...</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Trash</h1>
            <p className="text-sm text-gray-600 mt-1">Items in trash are deleted after 30 days</p>
          </div>
          {items.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={emptyTrash}
              size="sm"
            >
              Empty Trash
            </Button>
          )}
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <TrashIcon className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">Trash is empty</h3>
          <p className="text-sm">Deleted items will appear here</p>
        </div>
      ) : (
        <FileGrid
          items={items}
          viewMode="list"
          onItemClick={handleItemClick}
          onItemAction={handleItemAction}
        />
      )}
    </div>
  )
}