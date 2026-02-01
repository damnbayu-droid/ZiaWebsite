import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, FileText, Mic, User } from 'lucide-react';

const navItems = [
  { id: 'home', path: '/', icon: Home, label: 'Beranda' },
  { id: 'subjects', path: '/subjects', icon: BookOpen, label: 'Pelajaran' },
  { id: 'notes', path: '/notes', icon: FileText, label: 'Catatan' },
  { id: 'recordings', path: '/recordings', icon: Mic, label: 'Rekaman' },
  { id: 'profile', path: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show bottom nav on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-inset-bottom z-50">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${isActive
                    ? 'text-pink-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-pink-100' : ''
                    }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''
                      }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium mt-0.5 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-70'
                    }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
