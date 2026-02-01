import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  FileText,
  Search,
  Trash2,
  Edit3,
  Calendar,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Note, Subject } from '@/types';

export function NotesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Delete confirmation
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setNotes(notesData as Note[] || []);

      // Fetch subjects for dropdown
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

  const handleSaveNote = async () => {
    if (!user || !noteTitle.trim()) return;

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update({
          title: noteTitle.trim(),
          content: noteContent,
          subject_id: selectedSubjectId || null,
        })
        .eq('id', editingNote.id);

      if (!error) {
        setNotes(notes.map(n =>
          n.id === editingNote.id
            ? { ...n, title: noteTitle.trim(), content: noteContent, subject_id: selectedSubjectId || null }
            : n
        ));
      }
    } else {
      const newNote = {
        user_id: user.id,
        subject_id: selectedSubjectId || null,
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

    resetForm();
  };

  const handleDeleteNote = async () => {
    if (!deleteNote) return;

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', deleteNote.id);

    if (!error) {
      setNotes(notes.filter(n => n.id !== deleteNote.id));
    }
    setDeleteNote(null);
  };

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setSelectedSubjectId('');
    setEditingNote(null);
    setIsNoteDialogOpen(false);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setSelectedSubjectId(note.subject_id || '');
    setIsNoteDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsNoteDialogOpen(true);
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'General';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'General';
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
            <h1 className="text-lg font-bold text-gray-900">Semua Catatan</h1>
            <button
              onClick={openNewDialog}
              className="p-2 -mr-2 rounded-full hover:bg-pink-50 text-pink-600 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Cari catatan..."
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Catatan tidak ditemukan' : 'Belum ada catatan'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? 'Coba kata kunci pencarian lain'
                : 'Buat catatan pertamamu untuk memulai'}
            </p>
            {!searchQuery && (
              <Button
                onClick={openNewDialog}
                className="gradient-primary text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Catatan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="border-0 shadow-sm rounded-2xl overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {note.content || 'Tidak ada konten'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {getSubjectName(note.subject_id)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(note.updated_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => openEditDialog(note)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteNote(note)}
                        className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
              <Label htmlFor="note-subject">Pelajaran (Opsional)</Label>
              <select
                id="note-subject"
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

            <div className="space-y-2">
              <Label htmlFor="note-content">Isi</Label>
              <Textarea
                id="note-content"
                placeholder="Tulis catatanmu di sini..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="rounded-xl min-h-[200px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsNoteDialogOpen(false);
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteNote} onOpenChange={() => setDeleteNote(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Catatan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Apakah kamu yakin ingin menghapus <strong>{deleteNote?.title}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteNote(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteNote}
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
