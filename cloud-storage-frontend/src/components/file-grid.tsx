'use client'

import { useState } from 'react'
import { FolderIcon, MoreVerticalIcon, StarIcon, ShareIcon, DownloadIcon, Edit3Icon, TrashIcon } from 'lucide-react'
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils'
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

interface FileGridProps {
  items: FileItem[]
  viewMode: 'grid' | 'list'
  onItemClick: (item: FileItem) => void
  onItemAction: (action: string, item: FileItem) => void
}

export function FileGrid({ items, viewMode, onItemClick, onItemAction }: FileGridProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem } | null>(null)

  const handleItemSelect = (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, item })
  }

  const handleContextAction = (action: string) => {
    if (contextMenu) {
      onItemAction(action, contextMenu.item)
      setContextMenu(null)
    }
  }

  const getFileTypeClass = (mimeType?: string) => {
    if (!mimeType) return 'default'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
    if (mimeType.includes('image')) return 'img'
    if (mimeType.includes('video')) return 'video'
    if (mimeType.includes('audio')) return 'audio'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
    if (mimeType.includes('text') || mimeType.includes('code')) return 'code'
    return 'default'
  }

  // Close context menu when clicking elsewhere
  if (contextMenu) {
    const handleClickOutside = () => setContextMenu(null)
    setTimeout(() => document.addEventListener('click', handleClickOutside, { once: true }), 0)
  }

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-6 animate-fade-in">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group relative flex flex-col items-center p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-300 card-hover animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onItemClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              <input
                type="checkbox"
                className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                checked={selectedItems.has(item.id)}
                onChange={(e) => handleItemSelect(item.id, e as any)}
              />
              
              <div className="flex flex-col items-center w-full">
                <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {item.type === 'folder' ? (
                    <div className="relative">
                      <FolderIcon className="h-12 w-12 text-blue-500 drop-shadow-sm" />
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className={`file-icon ${getFileTypeClass(item.mimeType)}`}>
                      {getFileIcon(item.mimeType || '').slice(0, 3)}
                    </div>
                  )}
                </div>
                
                <div className="text-sm font-medium text-center truncate w-full mb-1 group-hover:text-blue-600 transition-colors duration-200">
                  {item.name}
                </div>
                
                {item.type === 'file' && item.size && (
                  <div className="text-xs text-gray-500">
                    {formatFileSize(item.size)}
                  </div>
                )}
              </div>
              
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {item.isStarred && (
                  <div className="p-1 rounded-full bg-yellow-100">
                    <StarIcon className="h-3 w-3 text-yellow-500 fill-current" />
                  </div>
                )}
                {item.isShared && (
                  <div className="p-1 rounded-full bg-blue-100">
                    <ShareIcon className="h-3 w-3 text-blue-500" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-white/20 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleContextMenu(e, item)
                  }}
                >
                  <MoreVerticalIcon className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white/25 backdrop-blur-md border border-white/20 rounded-lg py-2 min-w-48 z-50 animate-scale-in"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
              onClick={() => handleContextAction('star')}
            >
              <StarIcon className="h-4 w-4" />
              {contextMenu.item.isStarred ? 'Unstar' : 'Star'}
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
              onClick={() => handleContextAction('rename')}
            >
              <Edit3Icon className="h-4 w-4" />
              Rename
            </button>
            {contextMenu.item.type === 'file' && (
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
                onClick={() => handleContextAction('download')}
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </button>
            )}
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
              onClick={() => handleContextAction('share')}
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
            <hr className="my-1 border-white/20" />
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 text-red-400 hover:text-red-300 hover:bg-white/20"
              onClick={() => handleContextAction('delete')}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Modified
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Size
              </th>
              <th className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {items.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-white/30 cursor-pointer transition-all duration-200 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onItemClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelect(item.id, e as any)}
                    />
                    <div className="flex items-center">
                      <div className="mr-4 transform hover:scale-110 transition-transform duration-200">
                        {item.type === 'folder' ? (
                          <FolderIcon className="h-6 w-6 text-blue-500" />
                        ) : (
                          <div className={`file-icon ${getFileTypeClass(item.mimeType)} !w-8 !h-8 !text-sm`}>
                            {getFileIcon(item.mimeType || '').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {item.name}
                          {item.isStarred && (
                            <StarIcon className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {item.isShared && (
                            <ShareIcon className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {item.owner}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(item.modifiedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {item.type === 'file' && item.size ? formatFileSize(item.size) : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContextMenu(e, item)
                    }}
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu for List View */}
      {contextMenu && (
        <div
          className="fixed bg-white/25 backdrop-blur-md border border-white/20 rounded-lg py-2 min-w-48 z-50 animate-scale-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
            onClick={() => handleContextAction('star')}
          >
            <StarIcon className="h-4 w-4" />
            {contextMenu.item.isStarred ? 'Unstar' : 'Star'}
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
            onClick={() => handleContextAction('rename')}
          >
            <Edit3Icon className="h-4 w-4" />
            Rename
          </button>
          {contextMenu.item.type === 'file' && (
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
              onClick={() => handleContextAction('download')}
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </button>
          )}
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-white/20 hover:text-blue-600"
            onClick={() => handleContextAction('share')}
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
          <hr className="my-1 border-white/20" />
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 text-red-400 hover:text-red-300 hover:bg-white/20"
            onClick={() => handleContextAction('delete')}
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}