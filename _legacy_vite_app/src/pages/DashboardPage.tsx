import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, Mic, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  {
    id: 'subjects',
    title: 'Pelajaran',
    description: 'Lihat semua pelajaran',
    icon: BookOpen,
    color: 'bg-pink-500',
    path: '/subjects',
  },
  {
    id: 'notes',
    title: 'Catatan',
    description: 'Catatan belajar kamu',
    icon: FileText,
    color: 'bg-rose-500',
    path: '/notes',
  },
  {
    id: 'recordings',
    title: 'Rekaman',
    description: 'Memo suara',
    icon: Mic,
    color: 'bg-purple-500',
    path: '/recordings',
  },
  {
    id: 'profile',
    title: 'Profil',
    description: 'Info kamu',
    icon: User,
    color: 'bg-orange-500',
    path: '/profile',
  },
];

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Trea';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="gradient-primary text-white px-4 pt-8 pb-12 rounded-b-[2rem] safe-area-inset-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-pink-200" />
            <span className="text-sm text-pink-100 font-medium">
              {getGreeting()}
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            Hai, {firstName}! 👋
          </h1>
          <p className="text-pink-100 mt-1">
            Siap belajar hari ini?
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 -mt-6">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickActions.map((action) => (
            <Card
              key={action.id}
              className="border-0 shadow-md rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform touch-manipulation"
              onClick={() => navigate(action.path)}
            >
              <CardContent className="p-4">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Overview */}
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Ringkasan Hari Ini
              </h2>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    Terus belajar!
                  </p>
                  <p className="text-xs text-gray-600">
                    Kamu hebat. Terus semangat!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Tip */}
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Tips Belajar 💡
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Istirahatlah setiap 25-30 menit agar pikiran tetap segar.
                  Gunakan teknik Pomodoro untuk fokus lebih baik!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
