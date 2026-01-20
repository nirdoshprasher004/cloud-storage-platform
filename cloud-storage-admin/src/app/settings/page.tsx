'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  SettingsIcon, 
  DatabaseIcon, 
  ServerIcon, 
  ShieldIcon,
  HardDriveIcon,
  UsersIcon,
  FileIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SaveIcon,
  TestTubeIcon
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testingDatabase, setTestingDatabase] = useState(false)
  const [settings, setSettings] = useState({
    maxFileSize: '100',
    maxStoragePerUser: '10',
    allowPublicSharing: true,
    requireEmailVerification: false,
    maxSharesPerUser: '50',
    sessionTimeout: '24'
  })

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('✅ Settings saved successfully!')
    } catch (error) {
      alert('❌ Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch('http://localhost:3003/health')
      if (response.ok) {
        alert('✅ Backend connection successful!')
      } else {
        alert('❌ Backend connection failed')
      }
    } catch (error) {
      alert('❌ Backend connection failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleTestDatabase = async () => {
    setTestingDatabase(true)
    try {
      const response = await fetch('http://localhost:3003/api/test-db')
      if (response.ok) {
        alert('✅ Database connection successful!')
      } else {
        alert('❌ Database connection failed')
      }
    } catch (error) {
      alert('❌ Database connection failed')
    } finally {
      setTestingDatabase(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Settings
          </h1>
          <p className="text-slate-700 text-lg">Configure platform settings and system preferences</p>
        </div>

        {/* System Status */}
        <Card className="bg-white border-emerald-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ServerIcon className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Backend Server</div>
                      <div className="text-sm text-slate-700">Running on port 3003</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Frontend App</div>
                      <div className="text-sm text-slate-700">Running on port 3002</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">Admin Panel</div>
                      <div className="text-sm text-slate-700">Running on port 3004</div>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleTestConnection} 
                  disabled={testingConnection}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <TestTubeIcon className={`h-4 w-4 mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
                  {testingConnection ? 'Testing...' : 'Test Backend Connection'}
                </Button>
                
                <Button 
                  onClick={handleTestDatabase} 
                  disabled={testingDatabase}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  <DatabaseIcon className={`h-4 w-4 mr-2 ${testingDatabase ? 'animate-spin' : ''}`} />
                  {testingDatabase ? 'Testing...' : 'Test Database Connection'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Settings */}
        <Card className="bg-white border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <SettingsIcon className="h-5 w-5" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize" className="text-sm font-medium text-slate-700">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => setSettings({...settings, maxFileSize: e.target.value})}
                  className="bg-white border-slate-300 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxStoragePerUser" className="text-sm font-medium text-slate-700">Max Storage per User (GB)</Label>
                <Input
                  id="maxStoragePerUser"
                  type="number"
                  value={settings.maxStoragePerUser}
                  onChange={(e) => setSettings({...settings, maxStoragePerUser: e.target.value})}
                  className="bg-white border-slate-300 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxSharesPerUser" className="text-sm font-medium text-slate-700">Max Shares per User</Label>
                <Input
                  id="maxSharesPerUser"
                  type="number"
                  value={settings.maxSharesPerUser}
                  onChange={(e) => setSettings({...settings, maxSharesPerUser: e.target.value})}
                  className="bg-white border-slate-300 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="text-sm font-medium text-slate-700">Session Timeout (hours)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                  className="bg-white border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowPublicSharing"
                  checked={settings.allowPublicSharing}
                  onChange={(e) => setSettings({...settings, allowPublicSharing: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="allowPublicSharing" className="text-sm font-medium text-slate-700">Allow public link sharing</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="requireEmailVerification" className="text-sm font-medium text-slate-700">Require email verification for new users</Label>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSettings} 
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-white border-amber-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ShieldIcon className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <div className="font-medium text-slate-900">Authentication Method</div>
                    <div className="text-sm text-slate-700">Email and password with Supabase Auth</div>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <div className="font-medium text-slate-900">API Authentication</div>
                    <div className="text-sm text-slate-700">Bearer token with service role validation</div>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <div className="font-medium text-slate-900">Row Level Security (RLS)</div>
                    <div className="text-sm text-slate-700">Enabled for files, folders, and shares</div>
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <div className="font-medium text-slate-900">Users Table RLS</div>
                    <div className="text-sm text-amber-700">Disabled for admin operations</div>
                  </div>
                  <AlertCircleIcon className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <DatabaseIcon className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Database:</span>
                  <span className="text-sm font-medium text-slate-900">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Storage:</span>
                  <span className="text-sm font-medium text-slate-900">Supabase Storage</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Backend:</span>
                  <span className="text-sm font-medium text-slate-900">Node.js + Express</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Frontend:</span>
                  <span className="text-sm font-medium text-slate-900">Next.js + React</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <HardDriveIcon className="h-5 w-5" />
                Environment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Environment:</span>
                  <span className="text-sm font-medium text-slate-900">Development</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Supabase URL:</span>
                  <span className="text-xs font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    eorrfnhtjwwqwmnjvfoj.supabase.co
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">API Base URL:</span>
                  <span className="text-xs font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                    localhost:3003
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="text-sm text-slate-600">Current Admin:</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{user?.name}</div>
                    <div className="text-xs text-slate-600">{user?.email}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}