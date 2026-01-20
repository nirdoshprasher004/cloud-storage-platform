'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboardIcon,
  UsersIcon,
  FileIcon,
  ShareIcon,
  SettingsIcon,
  BarChart3Icon,
  LogOut,
  ChevronRightIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon, color: 'text-blue-400' },
  { name: 'Users', href: '/users', icon: UsersIcon, color: 'text-green-400' },
  { name: 'Files', href: '/files', icon: FileIcon, color: 'text-yellow-400' },
  { name: 'Activity', href: '/activity', icon: BarChart3Icon, color: 'text-purple-400' },
  { name: 'Shares', href: '/shares', icon: ShareIcon, color: 'text-pink-400' },
  { name: 'Settings', href: '/settings', icon: SettingsIcon, color: 'text-gray-400' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <LayoutDashboardIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CloudAdmin</h1>
            <p className="text-xs text-slate-400">Management Panel</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 sidebar-nav-item',
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full shadow-lg" />
              )}
              
              {/* Icon */}
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300',
                isActive 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg' 
                  : 'bg-slate-700/50 group-hover:bg-slate-600/50'
              )}>
                <item.icon className={cn(
                  'h-4 w-4 transition-colors duration-300',
                  isActive ? 'text-white' : item.color
                )} />
              </div>
              
              {/* Text */}
              <span className="flex-1">{item.name}</span>
              
              {/* Arrow for active item */}
              {isActive && (
                <ChevronRightIcon className="h-4 w-4 text-blue-400 animate-pulse" />
              )}
              
              {/* Hover glow effect */}
              <div className={cn(
                'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none',
                'bg-gradient-to-r from-blue-500/10 to-purple-500/10',
                'group-hover:opacity-100'
              )} />
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-slate-700/50 p-4 space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg status-online">
              <span className="text-sm font-bold text-white">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user.name || 'Admin User'}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {user.email || 'admin@example.com'}
            </div>
          </div>
        </div>
        
        {/* Logout Button */}
        <Button
          onClick={logout}
          className={cn(
            'w-full justify-start bg-slate-700/50 hover:bg-red-600/20 text-slate-300 hover:text-red-400',
            'border border-slate-600/50 hover:border-red-500/30 transition-all duration-300',
            'hover:shadow-lg hover:shadow-red-500/10'
          )}
          variant="ghost"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  )
}