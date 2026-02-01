import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  FileText,
  Mic,
  File,
  Play,
  Pause,
  Trash2,
  Clock,
  Calendar,
  X,
  Upload,
  Volume2
} from 'lucide-react';
import type { Subject, Note, Recording, Material } from '@/types';

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');

  // Note dialog states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<{ type: string; item: Note | Recording | Material } | null>(null);

  useEffect(() => {
    if (subjectId && user) {
      fetchSubjectData();
    }
  }, [subjectId, user]);

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

  const fetchSubjectData = async () => {
    if (!subjectId || !user) return;

    try {
      setLoading(true);

      // Fetch subject
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();
      setSubject(subjectData as Subject);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotes(notesData as Note[] || []);

      // Fetch recordings
      const { data: recordingsData } = await supabase
        .from('recordings')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRecordings(recordingsData as Recording[] || []);

      // Fetch materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMaterials(materialsData as Material[] || []);
    } catch (error) {
      console.error('Error fetching subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note handlers
  const handleSaveNote = async () => {
    if (!user || !subjectId || !noteTitle.trim()) return;

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update({ title: noteTitle.trim(), content: noteContent })
        .eq('id', editingNote.id);

      if (!error) {
        setNotes(notes.map(n =>
          n.id === editingNote.id
            ? { ...n, title: noteTitle.trim(), content: noteContent }
            : n
        ));
      }
    } else {
      const newNote = {
        user_id: user.id,
        subject_id: subjectId,
        title: noteTitle.trim(),
        content: noteContent,
      };

      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();

      if (!error && data) {
        setNotes([data as Note, ...notes]);
      }
    }

    setNoteTitle('');
    setNoteContent('');
    setEditingNote(null);
    setIsNoteDialogOpen(false);
  };

  const handleDeleteNote = async () => {
    if (!deleteItem || deleteItem.type !== 'note') return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', deleteItem.item.id);

    if (!error) {
      setNotes(notes.filter(n => n.id !== deleteItem.item.id));
    }
    setDeleteItem(null);
  };

  // Recording handlers
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
    if (!user || !subjectId || !recordingTitle.trim() || audioChunks.length === 0) return;

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const fileName = `${Date.now()}_${recordingTitle.trim()}.webm`;
    const filePath = `${user.id}/${subjectId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('recordings')
      .upload(filePath, audioBlob);

    if (uploadError) {
      console.error('Error uploading recording:', uploadError);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('recordings')
      .getPublicUrl(filePath);

    // Save to database
    const newRecording = {
      user_id: user.id,
      subject_id: subjectId,
      title: recordingTitle.trim(),
      file_url: publicUrl,
      duration: recordingTime,
    };

    const { data, error } = await supabase
      .from('recordings')
      .insert(newRecording)
      .select()
      .single();

    if (!error && data) {
      setRecordings([data as Recording, ...recordings]);
    }

    setRecordingTitle('');
    setAudioChunks([]);
    setRecordingTime(0);
    setIsRecordingDialogOpen(false);
  };

  const handleDeleteRecording = async () => {
    if (!deleteItem || deleteItem.type !== 'recording') return;

    const recording = deleteItem.item as Recording;

    // Delete from storage
    const filePath = recording.file_url.split('/').slice(-3).join('/');
    await supabase.storage.from('recordings').remove([filePath]);

    // Delete from database
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', recording.id);

    if (!error) {
      setRecordings(recordings.filter(r => r.id !== recording.id));
    }
    setDeleteItem(null);
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

  // Material handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !subjectId) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${user.id}/${subjectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);

    const newMaterial = {
      user_id: user.id,
      subject_id: subjectId,
      title: file.name,
      file_url: publicUrl,
      file_type: fileExt || 'unknown',
    };

    const { data, error } = await supabase
      .from('materials')
      .insert(newMaterial)
      .select()
      .single();

    if (!error && data) {
      setMaterials([data as Material, ...materials]);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteItem || deleteItem.type !== 'material') return;

    const material = deleteItem.item as Material;
    const filePath = material.file_url.split('/').slice(-3).join('/');

    await supabase.storage.from('materials').remove([filePath]);

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', material.id);

    if (!error) {
      setMaterials(materials.filter(m => m.id !== material.id));
    }
    setDeleteItem(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Subject not found</p>
        <Button onClick={() => navigate('/subjects')} className="gradient-primary text-white">
          Back to Subjects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/subjects')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{subject.name}</h1>
            <p className="text-xs text-gray-500">
              {notes.length} catatan • {recordings.length} rekaman • {materials.length} berkas
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-white shadow-sm p-1 mb-4">
            <TabsTrigger value="notes" className="rounded-lg text-xs">
              <FileText className="w-4 h-4 mr-1" />
              Catatan
            </TabsTrigger>
            <TabsTrigger value="recordings" className="rounded-lg text-xs">
              <Mic className="w-4 h-4 mr-1" />
              Rekaman
            </TabsTrigger>
            <TabsTrigger value="materials" className="rounded-lg text-xs">
              <File className="w-4 h-4 mr-1" />
              Berkas
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Catatan Kamu</h2>
              <Button
                size="sm"
                onClick={() => {
                  setEditingNote(null);
                  setNoteTitle('');
                  setNoteContent('');
                  setIsNoteDialogOpen(true);
                }}
                className="gradient-primary text-white rounded-lg h-8 text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah
              </Button>
            </div>

            {notes.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Belum ada catatan</p>
                  <p className="text-xs text-gray-400 mt-1">Buat catatan pertamamu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setEditingNote(note);
                            setNoteTitle(note.title);
                            setNoteContent(note.content);
                            setIsNoteDialogOpen(true);
                          }}
                        >
                          <h3 className="font-semibold text-gray-900 text-sm">{note.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDate(note.created_at)}</p>
                        </div>
                        <button
                          onClick={() => setDeleteItem({ type: 'note', item: note })}
                          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Rekaman Suara</h2>
              <Button
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={`rounded-lg h-8 text-xs ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white recording-pulse'
                    : 'gradient-primary text-white'
                  }`}
              >
                {isRecording ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Berhenti ({formatDuration(recordingTime)})
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-1" />
                    Rekam
                  </>
                )}
              </Button>
            </div>

            {recordings.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center">
                  <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Belum ada rekaman</p>
                  <p className="text-xs text-gray-400 mt-1">Rekam catatan suara pertamamu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording) => (
                  <Card key={recording.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlayRecording(recording)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${playingRecording === recording.id
                              ? 'bg-pink-500 text-white'
                              : 'bg-pink-100 text-pink-600'
                            }`}
                        >
                          {playingRecording === recording.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{recording.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
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
                          onClick={() => setDeleteItem({ type: 'recording', item: recording })}
                          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="mt-0">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Materi Belajar</h2>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gradient-primary text-white rounded-lg h-8 text-xs"
              >
                <Upload className="w-4 h-4 mr-1" />
                Unggah
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
              />
            </div>

            {materials.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center">
                  <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Belum ada berkas</p>
                  <p className="text-xs text-gray-400 mt-1">Unggah PDF, gambar, atau dokumen</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {materials.map((material) => (
                  <Card key={material.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <File className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{material.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 uppercase">{material.file_type}</p>
                          <p className="text-xs text-gray-400">{formatDate(material.created_at)}</p>
                        </div>
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteItem({ type: 'material', item: material })}
                          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Ubah Catatan' : 'Catatan Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Judul</Label>
              <Input
                id="note-title"
                placeholder="Judul catatan"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Isi</Label>
              <Textarea
                id="note-content"
                placeholder="Tulis catatanmu di sini..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="rounded-xl min-h-[150px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNoteDialogOpen(false);
                setEditingNote(null);
                setNoteTitle('');
                setNoteContent('');
              }}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={!noteTitle.trim()}
              className="gradient-primary text-white rounded-xl"
            >
              {editingNote ? 'Simpan Perubahan' : 'Buat Catatan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recording Save Dialog */}
      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Simpan Rekaman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <p className="text-sm text-gray-600">
              Durasi: {formatDuration(recordingTime)}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRecordingDialogOpen(false);
                setRecordingTitle('');
                setAudioChunks([]);
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
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus {deleteItem?.type === 'note' ? 'Catatan' : deleteItem?.type === 'recording' ? 'Rekaman' : 'Berkas'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah kamu yakin ingin menghapus <strong>{deleteItem?.item.title}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteItem(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (deleteItem?.type === 'note') handleDeleteNote();
                else if (deleteItem?.type === 'recording') handleDeleteRecording();
                else if (deleteItem?.type === 'material') handleDeleteMaterial();
              }}
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
