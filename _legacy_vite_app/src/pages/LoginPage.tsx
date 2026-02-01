import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, Eye, EyeOff, User } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const { signIn, signUp, isDemoMode } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          toast.success('Account created successfully! You can now log in.');
          setIsSignUp(false); // Switch back to login
          setPassword(''); // Clear password
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError('Invalid email or password. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  // Demo mode - auto login
  const handleDemoLogin = async () => {
    setLoading(true);
    await signIn('demo@example.com', 'demo123');
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen gradient-pink flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-sm">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/image/logo sman 1 kotabunan.webp"
              alt="Logo SMAN 1 Kotabunan"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Trea's Learning Hub
          </h1>
          <p className="text-sm text-gray-600">
            Ruang Belajar Pribadi Kamu
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">
              {isSignUp ? 'Buat Akun' : 'Selamat Datang! 👋'}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {isDemoMode
                ? 'Mode Demo - Klik "Masuk Demo" untuk mencoba'
                : (isSignUp
                  ? 'Mulai perjalanan belajarmu hari ini'
                  : 'Masukkan detailmu untuk lanjut belajar')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isDemoMode ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 text-center">
                    <strong>Mode Demo</strong><br />
                    Ini hanya pratinjau. Data tidak akan disimpan.
                  </p>
                </div>
                <Button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memuat...
                    </span>
                  ) : (
                    'Masuk Demo'
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field (Sign Up Only) */}
                {isSignUp && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Nama Lengkap
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@kamu.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? 'Membuat Akun...' : 'Masuk...'}
                    </span>
                  ) : (
                    isSignUp ? 'Buat Akun' : 'Masuk'
                  )}
                </Button>

                {/* Toggle Mode */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-gray-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                    disabled={loading}
                  >
                    {isSignUp
                      ? 'Sudah punya akun? Masuk'
                      : "Belum punya akun? Buat baru"}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Pribadi & Aman • Khusus untuk Trea
        </p>
      </div>
    </div>
  );
}
