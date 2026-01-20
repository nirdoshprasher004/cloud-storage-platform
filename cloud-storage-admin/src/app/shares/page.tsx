'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ShareIcon, LinkIcon, UsersIcon, FileIcon, FolderIcon, EyeIcon, RefreshCwIcon, ClockIcon, ExternalLinkIcon } from 'lucide-react'

interface UserShare {
  id: string
  resource_type: string
  resource_id: string
  role: string
  created_at: string
  created_by: string
  grantee: {
    name: string
    email: string
  }
}

interface LinkShare {
  id: string
  resource_type: string
  resource_id: string
  token: string
  role: string
  expires_at: string | null
  created_at: string
  created_by: string
}

export default function SharesPage() {
  const { user } = useAuth()
  const [userShares, setUserShares] = useState<UserShare[]>([])
  const [linkShares, setLinkShares] = useState<LinkShare[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadShares()
    }
  }, [user])

  const loadShares = async () => {
    try {
      setLoading(true)
      
      // Get all user shares
      const userSharesResponse = await fetch('http://localhost:3003/api/admin/shares/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      // Get all link shares
      const linkSharesResponse = await fetch('http://localhost:3003/api/admin/shares/link', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (userSharesResponse.ok) {
        const userData = await userSharesResponse.json()
        setUserShares(userData.shares || [])
      }
      
      if (linkSharesResponse.ok) {
        const linkData = await linkSharesResponse.json()
        setLinkShares(linkData.shares || [])
      }
      
    } catch (error) {
      console.error('Error loading shares:', error)
      // For now, we'll show empty state since the endpoints don't exist yet
      setUserShares([])
      setLinkShares([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadShares()
    setRefreshing(false)
  }

  const getResourceIcon = (resourceType: string) => {
    return resourceType === 'file' ? FileIcon : FolderIcon
  }

  const getResourceColor = (resourceType: string) => {
    return resourceType === 'file' ? 'text-blue-600' : 'text-amber-600'
  }

  const getResourceBgColor = (resourceType: string) => {
    return resourceType === 'file' 
      ? 'bg-blue-100' 
      : 'bg-amber-100'
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
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
              Shares
            </h1>
            <p className="text-slate-700 text-lg">Manage all platform shares and permissions</p>
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

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white border-purple-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">User Shares</CardTitle>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{userShares.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                Direct user-to-user shares
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Link Shares</CardTitle>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{linkShares.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                Public shareable links
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Shares</CardTitle>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShareIcon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{userShares.length + linkShares.length}</div>
              <p className="text-xs text-slate-600 mt-1">
                All active shares
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Shares Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-slate-900">User-to-User Shares ({userShares.length})</h2>
          </div>
          
          {userShares.length > 0 ? (
            <div className="grid gap-4">
              {userShares.map((share) => {
                const ResourceIcon = getResourceIcon(share.resource_type)
                const resourceColor = getResourceColor(share.resource_type)
                const resourceBgColor = getResourceBgColor(share.resource_type)
                
                return (
                  <Card key={share.id} className="hover-lift transition-all duration-300">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${resourceBgColor}`}>
                          <ResourceIcon className={`h-6 w-6 ${resourceColor}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-lg">
                            {share.resource_type} shared with {share.grantee?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-4">
                            <span>{share.grantee?.email}</span>
                            <span>•</span>
                            <span className="font-medium capitalize">{share.role} access</span>
                            <span>•</span>
                            <span>Shared {formatDate(share.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-700 capitalize">{share.role}</div>
                          <div className="text-xs text-slate-600">Permission</div>
                        </div>
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <EyeIcon className="h-4 w-4 text-slate-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No user shares found</h3>
                <p className="text-slate-600">User-to-user shares will appear here when users share content with each other.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Link Shares Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-slate-900">Public Link Shares ({linkShares.length})</h2>
          </div>
          
          {linkShares.length > 0 ? (
            <div className="grid gap-4">
              {linkShares.map((share) => {
                const ResourceIcon = getResourceIcon(share.resource_type)
                const resourceColor = getResourceColor(share.resource_type)
                const resourceBgColor = getResourceBgColor(share.resource_type)
                const isExpired = share.expires_at && new Date(share.expires_at) < new Date()
                
                return (
                  <Card key={share.id} className="hover-lift transition-all duration-300">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${resourceBgColor}`}>
                          <ResourceIcon className={`h-6 w-6 ${resourceColor}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-lg">
                            Public {share.resource_type} link
                          </div>
                          <div className="text-sm text-slate-600 flex items-center gap-4">
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
                              {share.token.substring(0, 16)}...
                            </span>
                            <span>•</span>
                            <span>Created {formatDate(share.created_at)}</span>
                            {share.expires_at && (
                              <>
                                <span>•</span>
                                <span className={isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                  {isExpired ? 'Expired' : 'Expires'} {formatDate(share.expires_at)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </div>
                          <div className="text-xs text-slate-600">Status</div>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isExpired 
                            ? 'bg-red-100' 
                            : 'bg-emerald-100'
                        }`}>
                          <ExternalLinkIcon className={`h-4 w-4 ${isExpired ? 'text-red-600' : 'text-emerald-600'}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No link shares found</h3>
                <p className="text-slate-600">Public link shares will appear here when users create shareable links.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}