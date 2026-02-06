'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IdentityBarcodeView } from '@/components/IdentityBarcodeView'
import { LandingPage } from '@/components/LandingPage'
import { DashboardContent } from '@/components/DashboardContent'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'barcode' | 'landing' | 'dashboard'>('landing')

  const [assignments, setAssignments] = useState<any[] | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[] | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        setViewMode('barcode')
        // Pre-fetch dashboard data for smooth transition
        fetchDashboardData()
      } else {
        setViewMode('landing')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    // Fetch pending assignments
    const { data: asgns } = await supabase
      .from('assignments')
      .select('*, subjects(name)')
      .order('due_date', { ascending: true })
      .limit(3)
    setAssignments(asgns)

    // Fetch recent activity
    const { data: activity } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    setRecentActivity(activity)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
    </div>
  )

  if (viewMode === 'barcode' && user) {
    return <IdentityBarcodeView onEnter={() => setViewMode('dashboard')} />
  }

  if (viewMode === 'landing') {
    return (
      <LandingPage
        onPreview={() => {
          setViewMode('dashboard')
          fetchDashboardData()
        }}
        onLogin={() => router.push('/login')}
      />
    )
  }

  // Default Dashboard View (for both auth and guest preview)
  return (
    <DashboardContent
      user={user}
      assignments={assignments}
      recentActivity={recentActivity}
      isGuest={!user}
    />
  )
}
