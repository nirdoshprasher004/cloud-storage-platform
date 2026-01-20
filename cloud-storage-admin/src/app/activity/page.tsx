'use client'

import { useEffect, useState } from 'react'
import { AdminAPI } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { 
  ActivityIcon, 
  FileIcon, 
  FolderIcon, 
  ShareIcon, 
  UploadIcon,
  EditIcon,
  TrashIcon,
  UserPlusIcon,
  RefreshCwIcon,
  ClockIcon,
  TrendingUpIcon
} from 'lucide-react'

interface Activity {
  id: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
  actor: {
    name: string
    email: string
  }
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case 'upload':
      return UploadIcon
    case 'create_folder':
      return FolderIcon
    case 'rename':
      return EditIcon
    case 'delete':
      return TrashIcon
    case 'share':
      return ShareIcon
    case 'user_register':
      return UserPlusIcon
    default:
      return ActivityIcon
  }
}

const getActivityColor = (action: string) => {
  switch (action) {
    case 'upload':
      return 'text-blue-600'
    case 'create_folder':
      return 'text-yellow-600'
    case 'rename':
      return 'text-green-600'
    case 'delete':
      return 'text-red-600'
    case 'share':
      return 'text-purple-600'
    case 'user_register':
      return 'text-indigo-600'
    default:
      return 'text-gray-600'
  }
}

const getActivityBgColor = (action: string) => {
  switch (action) {
    case 'upload':
      return 'bg-gradient-to-br from-blue-100 to-blue-200'
    case 'create_folder':
      return 'bg-gradient-to-br from-amber-100 to-amber-200'
    case 'rename':
      return 'bg-gradient-to-br from-emerald-100 to-emerald-200'
    case 'delete':
      return 'bg-gradient-to-br from-red-100 to-red-200'
    case 'share':
      return 'bg-gradient-to-br from-purple-100 to-purple-200'
    case 'user_register':
      return 'bg-gradient-to-br from-indigo-100 to-indigo-200'
    default:
      return 'bg-gradient-to-br from-slate-100 to-slate-200'
  }
}

const getActivityDescription = (activity: Activity) => {
  const { action, resource_type, actor } = activity
  const userName = actor?.name || 'Unknown user'
  
  switch (action) {
    case 'upload':
      return `${userName} uploaded a ${resource_type}`
    case 'create_folder':
      return `${userName} created a folder`
    case 'rename':
      return `${userName} renamed a ${resource_type}`
    case 'delete':
      return `${userName} deleted a ${resource_type}`
    case 'share':
      return `${userName} shared a ${resource_type}`
    case 'user_register':
      return `${userName} registered on the platform`
    default:
      return `${userName} performed ${action} on ${resource_type}`
  }
}

export default function ActivityPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getActivities()
      setActivities(response.activities || [])
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadActivities()
    setRefreshing(false)
  }

  // Group activities by action type for stats
  const activityStats = activities.reduce((acc, activity) => {
    acc[activity.action] = (acc[activity.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 animate-fade-in">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg skeleton" />
            <div className="h-4 w-80 bg-gradient-to-r from-slate-200 to-slate-300 rounded skeleton" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl skeleton" />
            ))}
          </div>
          
          {/* Activity List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
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
              Activity Log
            </h1>
            <p className="text-slate-700 text-lg">Monitor all platform activities and user actions</p>
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

        {/* Activity Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Activities</CardTitle>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ActivityIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activities.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                All recorded actions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">File Uploads</CardTitle>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <UploadIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activityStats.upload || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                Files uploaded
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Folders Created</CardTitle>
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <FolderIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activityStats.create_folder || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                New folders
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Shares Created</CardTitle>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <ShareIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activityStats.share || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                Items shared
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClockIcon className="h-5 w-5 text-slate-700" />
                Recent Activities ({activities.length})
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingUpIcon className="h-4 w-4" />
                Live monitoring
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const Icon = getActivityIcon(activity.action)
                  const iconColor = getActivityColor(activity.action)
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all duration-300">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityBgColor(activity.action)}`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">
                          {getActivityDescription(activity)}
                        </div>
                        <div className="text-sm text-slate-600 mt-1 flex items-center gap-4">
                          <span>{formatDate(activity.created_at)}</span>
                          {activity.actor?.email && (
                            <>
                              <span>•</span>
                              <span className="truncate">{activity.actor.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                          {activity.resource_type && (
                            <span className="capitalize">{activity.resource_type}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ActivityIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No activities found</h3>
                <p className="text-slate-600">User activities will appear here as they interact with the platform.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}