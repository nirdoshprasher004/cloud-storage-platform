'use client'

import { useState, useEffect } from 'react'
import { FileGrid } from '@/components/file-grid'
import { ClockIcon } from 'lucide-react'

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

export default function RecentPage() {
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentItems()
  }, [])

  const loadRecentItems = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        window.location.href = '/auth'
        return
      }

      const response = await fetch('http://localhost:3003/api/recent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const allItems: FileItem[] = data.files.map((file: any) => ({
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
        setItems(allItems)
      }
    } catch (error) {
      console.error('Error loading recent items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: FileItem) => {
    console.log('Recent item clicked:', item)
  }

  const handleItemAction = (action: string, item: FileItem) => {
    console.log('Action:', action, 'Item:', item)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg">Loading recent files...</div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Recent</h1>
        <p className="text-sm text-gray-600 mt-1">Files you've recently accessed</p>
      </div>
      
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <ClockIcon className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">No recent files</h3>
          <p className="text-sm">Files you access will appear here</p>
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