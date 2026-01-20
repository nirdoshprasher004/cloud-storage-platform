import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CloudIcon, ShieldIcon, ShareIcon, ZapIcon, ArrowRightIcon, CheckIcon } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden animate-fade-in">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <CloudIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CloudDrive
              </h1>
            </div>
            <Link href="/auth">
              <Button variant="outline" className="glass border-white/20 hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 text-sm font-medium mb-8 animate-scale-in">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Now with AI-powered file organization
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-in">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Secure Cloud Storage
            </span>
            <br />
            <span className="text-foreground">Made Simple</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Store, share, and collaborate on your files with enterprise-grade security, 
            lightning-fast performance, and an intuitive interface that just works.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto btn-gradient text-lg px-8 py-4 shadow-2xl animate-pulse-hover">
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto glass border-white/20 hover:bg-white/10 text-lg px-8 py-4">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">10M+</div>
              <div className="text-sm text-muted-foreground">Files Stored</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">150+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 animate-slide-in">
            Everything you need in one place
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Powerful features designed to make file management effortless and secure
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card text-center card-hover animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <ShieldIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Enterprise Security</h3>
            <p className="text-muted-foreground mb-6">
              End-to-end encryption, zero-knowledge architecture, and SOC 2 compliance 
              keep your files completely secure.
            </p>
            <ul className="text-sm text-left space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                256-bit AES encryption
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Two-factor authentication
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Advanced access controls
              </li>
            </ul>
          </div>
          
          <div className="glass-card text-center card-hover animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <ShareIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Smart Collaboration</h3>
            <p className="text-muted-foreground mb-6">
              Share files instantly with granular permissions, real-time collaboration, 
              and seamless team workflows.
            </p>
            <ul className="text-sm text-left space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Real-time file sync
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Public & private sharing
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Team workspaces
              </li>
            </ul>
          </div>
          
          <div className="glass-card text-center card-hover animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ZapIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
            <p className="text-muted-foreground mb-6">
              Global CDN, intelligent caching, and optimized infrastructure deliver 
              blazing-fast file access worldwide.
            </p>
            <ul className="text-sm text-left space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Global edge network
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Instant file preview
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                Smart compression
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="glass-card text-center max-w-3xl mx-auto animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform your file management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who trust CloudDrive with their most important files.
          </p>
          <Link href="/auth">
            <Button size="lg" className="btn-gradient text-lg px-12 py-4 shadow-2xl animate-pulse-hover">
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 15GB free storage • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/10 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <CloudIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-foreground">CloudDrive</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CloudDrive. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}