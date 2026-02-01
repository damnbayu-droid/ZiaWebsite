import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Book, FileText, CheckCircle, Clock, Users, ArrowRight, Mic, ScanText, MessageSquare, FolderOpen } from 'lucide-react'
import AIAssistant from '@/components/AIAssistant'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch pending assignments count?
  // Fetch unread messages?
  // For now simple UI.

  return (
    <div className="min-h-screen bg-gray-50 pb-44 safe-area-inset-bottom">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Selamat datang,</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.user_metadata?.full_name || 'Siswa'}! 👋</h1>
        </div>
        <Link href="/chat">
          <Button size="icon" variant="ghost" className="rounded-full relative">
            <MessageSquare className="w-6 h-6 text-gray-600" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </Button>
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* AI Assistant Card */}
        <AIAssistant />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Pelajaran', icon: Book, href: '/subjects', color: 'bg-pink-100 text-pink-600' },
            { label: 'Tugas', icon: CheckCircle, href: '/assignments', color: 'bg-orange-100 text-orange-600' },
            { label: 'Catatan', icon: FileText, href: '/notes', color: 'bg-blue-100 text-blue-600' },
            { label: 'Kelas', icon: Users, href: '/classes', color: 'bg-green-100 text-green-600' },
            { label: 'Rekam', icon: Mic, href: '/recordings', color: 'bg-purple-100 text-purple-600' },
            { label: 'Pindai', icon: ScanText, href: '/scan', color: 'bg-indigo-100 text-indigo-600' },
            { label: 'Materi', icon: FolderOpen, href: '/materials', color: 'bg-teal-100 text-teal-600' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-active:scale-95 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </Link>
          ))}
          {/* More... */}
        </div>

        {/* Pending Assignments Widget */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-gray-900">Tugas Tertunda</h2>
            <Link href="/assignments" className="text-xs font-semibold text-pink-600">Lihat Semua</Link>
          </div>
          {/* Placeholder for fetching real data */}
          <div className="space-y-3">
            <Card className="p-4 flex items-center gap-4 border-0 shadow-sm rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Latihan Soal Matematika</h3>
                <p className="text-xs text-gray-400">Tenggat: Besok, 08:00</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </Card>
            <Card className="p-4 flex items-center gap-4 border-0 shadow-sm rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Book className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Rangkuman Sejarah Bab 3</h3>
                <p className="text-xs text-gray-400">Tenggat: 3 Hari lagi</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </Card>
          </div>
        </div>

        {/* Recent Class Activity Widget */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-gray-900">Diskusi Kelas</h2>
            <Link href="/chat" className="text-xs font-semibold text-pink-600">Buka Chat</Link>
          </div>
          <Card className="p-4 border-0 shadow-sm rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-300 mb-1">X IPA 1 • Pak Budi</p>
                <p className="text-sm font-medium line-clamp-2">Jangan lupa pelajari materi tentang Hukum Newton untuk kuis besok ya anak-anak.</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
