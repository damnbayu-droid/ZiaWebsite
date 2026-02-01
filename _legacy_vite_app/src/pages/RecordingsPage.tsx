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
  Mic,
  Play,
  Pause,
  Trash2,
  Clock,
  Calendar,
  X,
  Volume2,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Recording, Subject } from '@/types';

export function RecordingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Delete confirmation
  const [deleteRecording, setDeleteRecording] = useState<Recording | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch recordings
      const { data: recordingsData } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRecordings(recordingsData as Recording[] || []);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      setSubjects(subjectsData as Subject[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
        setIsRecordingDialogOpen(true);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  const saveRecording = async () => {
    if (!user || !recordingTitle.trim() || audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const fileName = `${Date.now()}_${recordingTitle.trim()}.webm`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, audioBlob);

    if (uploadError) {
      console.error('Error uploading recording:', uploadError);
      alert('Failed to upload recording. Please try again.');
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    // Save to database
    const newRecording = {
      user_id: user.id,
      subject_id: selectedSubjectId || null,
      title: recordingTitle.trim(),
      file_url: publicUrl,
      duration: recordingTime,
    };

    const { data, error } = await supabase
      .from('recordings')
      .insert(newRecording)
      .select()
      .single();

    if (error) {
      console.error('Error saving recording:', error);
      alert('Failed to save recording. Please try again.');
      return;
    }

    setRecordings([data as Recording, ...recordings]);
    resetRecordingState();
  };

  const resetRecordingState = () => {
    setRecordingTitle('');
    setSelectedSubjectId('');
    setAudioChunks([]);
    setRecordingTime(0);
    setIsRecordingDialogOpen(false);
  };

  const handleDeleteRecording = async () => {
    if (!deleteRecording) return;

    // Delete from storage
    const filePath = deleteRecording.file_url.split('/').slice(-2).join('/');
    await supabase.storage.from('recordings').remove([filePath]);

    // Delete from database
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', deleteRecording.id);

    if (!error) {
      setRecordings(recordings.filter(r => r.id !== deleteRecording.id));
    }
    setDeleteRecording(null);
  };

  const togglePlayRecording = (recording: Recording) => {
    if (playingRecording === recording.id) {
      audioRef.current?.pause();
      setPlayingRecording(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(recording.file_url);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingRecording(null);
      setPlayingRecording(recording.id);
    }
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'General';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'General';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Rekaman</h1>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 -mr-2 rounded-full transition-colors ${isRecording
                  ? 'bg-red-500 text-white recording-pulse'
                  : 'hover:bg-pink-50 text-pink-600'
                }`}
            >
              {isRecording ? <X className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Cari rekaman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 focus:border-pink-400 focus:ring-pink-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full recording-pulse" />
                <span className="text-sm font-medium text-red-700">Merekam...</span>
              </div>
              <span className="text-lg font-mono font-semibold text-red-700">
                {formatDuration(recordingTime)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Rekaman tidak ditemukan' : 'Belum ada rekaman'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? 'Coba kata kunci pencarian lain'
                : 'Rekam pelajaran, catatan, atau diskusi'}
            </p>
            {!searchQuery && !isRecording && (
              <Button
                onClick={startRecording}
                className="gradient-primary text-white rounded-xl"
              >
                <Mic className="w-4 h-4 mr-2" />
                Mulai Merekam
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecordings.map((recording) => (
              <Card
                key={recording.id}
                className="border-0 shadow-sm rounded-2xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlayRecording(recording)}
                      className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${playingRecording === recording.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-pink-100 text-pink-600'
                        }`}
                    >
                      {playingRecording === recording.id ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {recording.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {getSubjectName(recording.subject_id)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(recording.duration || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(recording.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteRecording(recording)}
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Recording Save Dialog */}
      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Simpan Rekaman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
                <Volume2 className="w-10 h-10 text-pink-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-semibold text-gray-900">
                {formatDuration(recordingTime)}
              </p>
              <p className="text-sm text-gray-500">Durasi rekaman</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recording-title">Judul Rekaman</Label>
              <Input
                id="recording-title"
                placeholder="contoh: Pelajaran Fisika"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recording-subject">Pelajaran (Opsional)</Label>
              <select
                id="recording-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-pink-400 focus:ring-pink-400 focus:outline-none"
              >
                <option value="">Umum (Tanpa Pelajaran)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetRecordingState();
              }}
              className="rounded-xl"
            >
              Buang
            </Button>
            <Button
              onClick={saveRecording}
              disabled={!recordingTitle.trim()}
              className="gradient-primary text-white rounded-xl"
            >
              Simpan Rekaman
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRecording} onOpenChange={() => setDeleteRecording(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Rekaman</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah kamu yakin ingin menghapus <strong>{deleteRecording?.title}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRecording(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteRecording}
              variant="destructive"
              className="rounded-xl"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
