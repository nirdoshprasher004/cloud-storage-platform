'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { FileIcon, FolderIcon, ShareIcon, UserIcon } from 'lucide-react'

interface Activity {
  id: string
  type: 'file_upload' | 'folder_create' | 'share_create' | 'user_register'
  user: {
    name: string
    email: string
  }
  resource?: {
    name: string
    type: 'file' | 'folder'
  }
  createdAt: string
}

interface RecentActivityProps {
  activities: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file_upload':
        return <FileIcon className="h-4 w-4 text-green-600" />
      case 'folder_create':
        return <FolderIcon className="h-4 w-4 text-blue-600" />
      case 'share_create':
        return <ShareIcon className="h-4 w-4 text-purple-600" />
      case 'user_register':
        return <UserIcon className="h-4 w-4 text-orange-600" />
      default:
        return <FileIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'file_upload':
        return `uploaded "${activity.resource?.name}"`
      case 'folder_create':
        return `created folder "${activity.resource?.name}"`
      case 'share_create':
        return `shared "${activity.resource?.name}"`
      case 'user_register':
        return 'registered an account'
      default:
        return 'performed an action'
    }
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest user actions on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user.name}
                </p>
                <p className="text-sm text-gray-500">
                  {getActivityText(activity)}
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-500">
                {formatDate(activity.createdAt)}
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}