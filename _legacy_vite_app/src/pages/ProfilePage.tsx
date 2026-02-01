import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  School,
  Calendar,
  MapPin,
  LogOut,
  Edit3,
  BookOpen,
  Mic,
  FileText,
  Sparkles,
  Save,
  Camera,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');

  // Stats
  const [stats, setStats] = useState({
    subjects: 0,
    notes: 0,
    recordings: 0,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBirthPlace(profile.birth_place || '');
      setBirthDate(profile.birth_date || '');
      setSchool(profile.school || '');
      setGrade(profile.grade || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [subjectsRes, notesRes, recordingsRes] = await Promise.all([
        supabase.from('subjects').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('recordings').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      setStats({
        subjects: subjectsRes.count || 0,
        notes: notesRes.count || 0,
        recordings: recordingsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);

    const updateData = {
      full_name: fullName.trim(),
      birth_place: birthPlace.trim() || null,
      birth_date: birthDate || null,
      school: school.trim() || null,
      grade: grade.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } else {
      await refreshProfile();
      setIsEditDialogOpen(false);
      toast.success('Profil berhasil diperbarui');
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    try {
      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Foto profil berhasil diperbarui');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Gagal mengunggah foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum diatur';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="gradient-primary text-white px-4 pt-8 pb-16 rounded-b-[2rem] safe-area-inset-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-lg font-bold">Profil</h1>
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="p-2 -mr-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="text-center relative">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden border-2 border-white/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="absolute bottom-4 right-0 p-1.5 bg-white rounded-full shadow-md text-pink-500 hover:bg-gray-100 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h2 className="text-2xl font-bold">{profile?.full_name || 'Pengguna'}</h2>
            <p className="text-pink-100 mt-1">
              {profile?.school || 'Sekolah Belum Diatur'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                {profile?.grade || 'Kelas Belum Diatur'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.subjects}</p>
              <p className="text-xs text-gray-500">Pelajaran</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.notes}</p>
              <p className="text-xs text-gray-500">Catatan</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Mic className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.recordings}</p>
              <p className="text-xs text-gray-500">Audio</p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Info */}
        <Card className="border-0 shadow-md rounded-2xl mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Informasi Pribadi
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Nama Lengkap</p>
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Belum diatur'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Tempat Lahir</p>
                  <p className="text-sm font-medium text-gray-900">{profile?.birth_place || 'Belum diatur'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Tanggal Lahir</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(profile?.birth_date || null)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <School className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Sekolah</p>
                  <p className="text-sm font-medium text-gray-900">{profile?.school || 'Belum diatur'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Kelas</p>
                  <p className="text-sm font-medium text-gray-900">{profile?.grade || 'Belum diatur'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card className="border-0 shadow-md rounded-2xl mb-4">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tentang Aplikasi Ini</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ini adalah ruang belajar pribadi Anda, dirancang untuk membantu Anda mengatur
              pelajaran, mencatat, dan merekam pelajaran penting. Teruslah belajar
              dan berkembang setiap hari!
            </p>
            <div className="mt-4 p-3 bg-pink-50 rounded-xl">
              <p className="text-xs text-pink-700">
                <strong>Tips:</strong> Meninjau catatan secara teratur membantu meningkatkan
                daya ingat. Cobalah untuk meninjau catatan Anda dalam waktu 24 jam setelah mencatatnya!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={() => setIsLogoutDialogOpen(true)}
          variant="outline"
          className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Keluar
        </Button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Trea's Learning Hub v1.0
        </p>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Nama Lengkap</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl"
                placeholder="Nama lengkap Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth-place">Tempat Lahir</Label>
              <Input
                id="birth-place"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="rounded-xl"
                placeholder="Kota kelahiran"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth-date">Tanggal Lahir</Label>
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">Sekolah</Label>
              <Input
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="rounded-xl"
                placeholder="Nama sekolah Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Kelas</Label>
              <Input
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="rounded-xl"
                placeholder="Contoh: Kelas 10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || !fullName.trim()}
              className="gradient-primary text-white rounded-xl"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Keluar</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin keluar?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
