'use client'

import { useAuth } from '@/contexts/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Dashboard } from '@/components/dashboard/dashboard'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-bold text-black">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  )
}