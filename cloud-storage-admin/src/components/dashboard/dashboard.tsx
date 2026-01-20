'use client'

import { useState, useEffect } from 'react'
import { StatsCards } from './stats-cards'
import { UsageChart } from './usage-chart'
import { RecentActivity } from './recent-activity'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalFolders: 0,
    totalShares: 0,
    totalStorage: 0,
    activeUsers: 0
  })

  const [usageData, setUsageData] = useState([
    { date: '2024-01-01', users: 45, files: 120, storage: 2400 },
    { date: '2024-01-02', users: 52, files: 135, storage: 2600 },
    { date: '2024-01-03', users: 48, files: 128, storage: 2500 },
    { date: '2024-01-04', users: 61, files: 142, storage: 2800 },
    { date: '2024-01-05', users: 55, files: 138, storage: 2700 },
    { date: '2024-01-06', users: 67, files: 155, storage: 3100 },
    { date: '2024-01-07', users: 59, files: 148, storage: 2900 }
  ])

  const [activities, setActivities] = useState([
    {
      id: '1',
      type: 'file_upload' as const,
      user: { name: 'John Doe', email: 'john@example.com' },
      resource: { name: 'document.pdf', type: 'file' as const },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'user_register' as const,
      user: { name: 'Jane Smith', email: 'jane@example.com' },
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      type: 'folder_create' as const,
      user: { name: 'Bob Wilson', email: 'bob@example.com' },
      resource: { name: 'Projects', type: 'folder' as const },
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ])

  useEffect(() => {
    // Load stats from API
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:3003/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        } else {
          // Fallback to demo data if API fails
          setStats({
            totalUsers: 156,
            totalFiles: 2847,
            totalFolders: 423,
            totalShares: 89,
            totalStorage: 15728640000, // ~15GB
            activeUsers: 47
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
        // Fallback to demo data
        setStats({
          totalUsers: 156,
          totalFiles: 2847,
          totalFolders: 423,
          totalShares: 89,
          totalStorage: 15728640000, // ~15GB
          activeUsers: 47
        })
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-700 text-lg">Welcome to CloudDrive Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts and Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        <UsageChart data={usageData} />
        <RecentActivity activities={activities} />
      </div>
    </div>
  )
}