'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersIcon, FolderIcon, FileIcon, ShareIcon, TrendingUpIcon } from 'lucide-react'
import { formatNumber, formatFileSize } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    totalUsers: number
    totalFiles: number
    totalFolders: number
    totalShares: number
    totalStorage: number
    activeUsers: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      subtitle: `${formatNumber(stats.activeUsers)} active`,
      icon: UsersIcon,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'from-blue-500/20 to-cyan-500/20',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Files',
      value: formatNumber(stats.totalFiles),
      subtitle: formatFileSize(stats.totalStorage),
      icon: FileIcon,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'from-emerald-500/20 to-teal-500/20',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Folders',
      value: formatNumber(stats.totalFolders),
      subtitle: 'Organized storage',
      icon: FolderIcon,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'from-amber-500/20 to-orange-500/20',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Shares',
      value: formatNumber(stats.totalShares),
      subtitle: 'Active shares',
      icon: ShareIcon,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'from-purple-500/20 to-pink-500/20',
      trend: '+15%',
      trendUp: true
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
      {cards.map((card, index) => (
        <Card key={index} className="stats-card group relative overflow-hidden hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-gradient-to-br ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className={`h-4 w-4 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                {card.value}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUpIcon className={`h-3 w-3 ${card.trendUp ? 'text-emerald-500' : 'text-red-500'}`} />
                <span className={`font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.trend}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {card.subtitle}
            </p>
          </CardContent>
          
          {/* Decorative gradient overlay */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />
        </Card>
      ))}
    </div>
  )
}