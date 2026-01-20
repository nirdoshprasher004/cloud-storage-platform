'use client'

import { ShareIcon } from 'lucide-react'

export default function SharedPage() {
  return (
    <div className="h-full">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Shared with me</h1>
        <p className="text-sm text-gray-600 mt-1">Files and folders others have shared with you</p>
      </div>
      
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <ShareIcon className="h-16 w-16 mb-4" />
        <h3 className="text-lg font-medium mb-2">No shared items</h3>
        <p className="text-sm">Files shared with you will appear here</p>
      </div>
    </div>
  )
}