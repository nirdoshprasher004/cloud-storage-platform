'use client'

import { useState } from 'react'
import { SearchIcon, GridIcon, ListIcon, UserIcon, BellIcon, SettingsIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Header({ viewMode, onViewModeChange, searchQuery, onSearchChange }: HeaderProps) {
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSearch = async (query: string) => {
    setLocalSearch(query)
    onSearchChange(query)
    
    if (query.trim()) {
      // Navigate to search results or trigger search
      console.log('Searching for:', query)
      // You can implement search results page or update current page
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(localSearch)
    }
  }

  const handleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  const handleLogout = async () => {
    if (confirm('Sign out?')) {
      try {
        // Check if environment variables are available
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseAnonKey) {
          // Import supabase client
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(supabaseUrl, supabaseAnonKey)
          
          await supabase.auth.signOut()
        }
        
        router.push('/auth')
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/auth')
      }
    }
    setShowUserMenu(false)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm animate-fade-in">
      {/* Search Section */}
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
          <Input
            type="text"
            placeholder="Search files and folders..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 w-full h-11 bg-white border-2 border-gray-300 focus:bg-white focus:border-blue-500 transition-all duration-300 placeholder:text-black text-black font-bold"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 text-black font-bold"
              onClick={() => {
                setLocalSearch('')
                onSearchChange('')
              }}
            >
              ×
            </Button>
          )}
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-3 ml-6">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 border-2 border-gray-300 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`h-8 px-3 transition-all duration-200 font-bold ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'hover:bg-gray-200 text-black hover:text-black'
            }`}
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`h-8 px-3 transition-all duration-200 font-bold ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'hover:bg-gray-200 text-black hover:text-black'
            }`}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 relative"
        >
          <BellIcon className="h-4 w-4 text-black" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </Button>

        {/* Settings */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-all duration-300"
        >
          <SettingsIcon className="h-4 w-4 text-black" />
        </Button>
        
        {/* User Menu */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUserMenu}
            className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-400 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 relative overflow-hidden"
          >
            <UserIcon className="h-4 w-4 text-white" />
          </Button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-300 rounded-lg py-2 min-w-48 z-50 animate-scale-in shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-bold text-black">John Doe</p>
                <p className="text-xs font-bold text-black">john@example.com</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 hover:text-blue-600 text-left font-bold text-black">
                  Profile Settings
                </button>
                <button className="w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 hover:text-blue-600 text-left font-bold text-black">
                  Storage Settings
                </button>
                <button className="w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 hover:bg-gray-100 hover:text-blue-600 text-left font-bold text-black">
                  Help & Support
                </button>
                <hr className="my-1 border-gray-200" />
                <button 
                  className="w-full px-4 py-2 text-sm cursor-pointer transition-colors duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 text-left font-bold"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  )
}