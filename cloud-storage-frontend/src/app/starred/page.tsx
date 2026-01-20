'use client'

import { useState, useEffect } from 'react'
import { FileGrid } from '@/components/file-grid'
import { StarIcon } from 'lucide-react'

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

export default function StarredPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStarredItems()
  }, [])

  const loadStarredItems = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/auth'
        return
      }

      const response = await fetch('http://localhost:3003/api/starred', {
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
            isStarred: true,
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
            isStarred: true,
            isShared: false
          }))
        ]
        setItems(allItems)
      }
    } catch (error) {
      console.error('Error loading starred items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FileItem) => {
    console.log('Starred item clicked:', item)
  }

  const handleItemAction = async (action: string, item: FileItem) => {
    if (action === 'unstar') {
      try {
        const token = localStorage.getItem('access_token')
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
        loadStarredItems() // Refresh
      } catch (error) {
        console.error('Error unstarring item:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg">Loading starred items...</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Starred</h1>
        <p className="text-sm text-gray-600 mt-1">Items you've starred for quick access</p>
      </div>
      
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <StarIcon className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">No starred items</h3>
          <p className="text-sm">Star files and folders to find them quickly here</p>
        </div>
      ) : (
        <FileGrid
          items={items}
          viewMode="grid"
          onItemClick={handleItemClick}
          onItemAction={handleItemAction}
        />
      )}
    </div>
  )
}