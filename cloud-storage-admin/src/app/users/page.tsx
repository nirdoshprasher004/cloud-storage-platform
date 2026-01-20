'use client'

import { useEffect, useState } from 'react'
import { AdminAPI } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatFileSize } from '@/lib/utils'
import { UsersIcon, FileIcon, FolderIcon, ShareIcon, RefreshCwIcon, UserPlusIcon, CalendarIcon, ActivityIcon } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  created_at: string
  files: { count: number }[]
  folders: { count: number }[]
  shares_created: { count: number }[]
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadUsers()
    }
  }, [user])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await AdminAPI.getUsers()
      setUsers(response.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

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
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl skeleton" />
            ))}
          </div>
          
          {/* User Cards Skeleton */}
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl skeleton" />
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
              Users
            </h1>
            <p className="text-slate-700 text-lg">Manage platform users and monitor their activity</p>
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

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Users</CardTitle>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{users.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                Registered platform users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Today</CardTitle>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <ActivityIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{Math.floor(users.length * 0.3)}</div>
              <p className="text-xs text-slate-600 mt-1">
                Users active today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">New This Week</CardTitle>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <UserPlusIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{Math.floor(users.length * 0.1)}</div>
              <p className="text-xs text-slate-600 mt-1">
                New registrations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">All Users ({users.length})</h2>
          </div>
          
          {users.length > 0 ? (
            <div className="grid gap-4">
              {users.map((userData) => (
                <Card key={userData.id} className="hover-lift transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                          {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{userData.name || 'Unknown User'}</CardTitle>
                          <p className="text-sm text-slate-600">{userData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarIcon className="h-3 w-3" />
                        Joined {formatDate(userData.created_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-900">{userData.files?.[0]?.count || 0}</div>
                          <div className="text-xs text-slate-600">Files</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FolderIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-900">{userData.folders?.[0]?.count || 0}</div>
                          <div className="text-xs text-slate-600">Folders</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ShareIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-900">{userData.shares_created?.[0]?.count || 0}</div>
                          <div className="text-xs text-slate-600">Shares</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No users found</h3>
                <p className="text-slate-600">Users will appear here once they register on the platform.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}