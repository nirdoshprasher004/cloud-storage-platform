'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CloudIcon, MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      if (isLogin) {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(error.message)
        } else if (data.session) {
          setMessage('Login successful! Redirecting...')
          setTimeout(() => {
            window.location.href = '/drive'
          }, 1000)
        }
      } else {
        // Register with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        })

        if (error) {
          setMessage(error.message)
        } else if (data.user) {
          setMessage('Registration successful! Please check your email to confirm your account.')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl mb-6">
            <CloudIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            CloudDrive
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl animate-slide-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10 bg-white/20 backdrop-blur-sm border-white/20 focus:bg-white/10 focus:border-blue-300"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 bg-white/20 backdrop-blur-sm border-white/20 focus:bg-white/10 focus:border-blue-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-white/20 backdrop-blur-sm border-white/20 focus:bg-white/10 focus:border-blue-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium animate-scale-in ${
                message.includes('successful') 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient h-12 text-base font-semibold shadow-lg animate-pulse-hover"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                isLogin ? 'Sign in' : 'Create Account'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setMessage('')
                }}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CloudIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">Secure Storage</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">Easy Sharing</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <LockIcon className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500">Privacy First</p>
          </div>
        </div>
      </div>
    </div>
  )
}