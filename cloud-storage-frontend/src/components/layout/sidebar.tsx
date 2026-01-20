'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  FolderIcon, 
  ShareIcon, 
  StarIcon, 
  ClockIcon, 
  TrashIcon,
  PlusIcon,
  UploadIcon,
  LogOutIcon,
  CloudIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navigation = [
  { name: 'My Drive', href: '/drive', icon: FolderIcon, color: 'text-blue-500' },
  { name: 'Shared with me', href: '/shared', icon: ShareIcon, color: 'text-green-500' },
  { name: 'Starred', href: '/starred', icon: StarIcon, color: 'text-yellow-500' },
  { name: 'Recent', href: '/recent', icon: ClockIcon, color: 'text-purple-500' },
  { name: 'Trash', href: '/trash', icon: TrashIcon, color: 'text-red-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    router.push('/auth')
  }

  const handleNewFolder = () => {
    // This will be handled by the main drive page
    setShowNewFolder(true)
  }

  const handleUpload = () => {
    if (isUploading) return
    
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setIsUploading(true)
        try {
          const token = localStorage.getItem('access_token')
          const formData = new FormData()
          
          // Add all selected files to FormData
          Array.from(files).forEach(file => {
            formData.append('files', file)
          })
          
          // Add current folder ID if available
          formData.append('folderId', 'root') // You can make this dynamic
          
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
            // Refresh the current page
            window.location.reload()
          } else {
            const error = await response.json()
            alert(`Upload failed: ${error.error}`)
          }
        } catch (error) {
          console.error('Upload error:', error)
          alert('Upload failed. Please try again.')
        } finally {
          setIsUploading(false)
        }
      }
    }
    input.click()
  }

  return (
    <div className="sidebar flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-lg animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 sidebar-header">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <CloudIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 
              className="text-lg font-black text-black" 
              style={{ 
                color: '#000000 !important', 
                fontWeight: '900 !important',
                backgroundColor: '#ffff00',
                padding: '2px 4px',
                display: 'block',
                fontSize: '18px'
              }}
            >
              CloudDrive
            </h1>
            <p 
              className="text-xs font-bold text-black" 
              style={{ 
                color: '#000000 !important', 
                fontWeight: '700 !important',
                backgroundColor: '#ffff00',
                padding: '2px 4px',
                display: 'block',
                fontSize: '12px'
              }}
            >
              Your files, everywhere
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 p-4">
        <Button 
          className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white h-11 font-bold shadow-lg animate-pulse-hover"
          onClick={handleNewFolder}
        >
          <PlusIcon className="h-4 w-4" />
          New Folder
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-11 font-bold bg-white border-2 border-gray-300 hover:bg-gray-50 text-black transition-all duration-300"
          onClick={handleUpload}
          disabled={isUploading}
        >
          <UploadIcon className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 pb-4">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 animate-slide-in',
                isActive
                  ? 'bg-blue-100 text-black border-2 border-blue-300 shadow-lg'
                  : 'text-black hover:bg-gray-100 hover:text-black hover:shadow-md border-2 border-transparent hover:border-gray-200'
              )}
              style={{ animationDelay: `${(index + 2) * 100}ms` }}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300',
                  isActive 
                    ? 'text-blue-600 drop-shadow-sm' 
                    : 'text-black group-hover:scale-110'
                )}
              />
              <span className="truncate font-bold text-black">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Storage Usage */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-black">Storage</span>
            <span className="text-xs font-bold text-black">2.1 GB of 15 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: '14%' }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-black font-bold hover:text-black hover:bg-red-100 hover:border-red-300 border-2 border-transparent transition-all duration-300 h-11"
          onClick={handleLogout}
        >
          <LogOutIcon className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}