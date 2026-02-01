import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Atom,
  Microscope,
  Globe,
  Map,
  MoreVertical,
  Trash2,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Subject } from '@/types';

const defaultSubjects = [
  { name: 'Matematika', icon: 'calculator', color: '#3b82f6' },
  { name: 'Bahasa Indonesia', icon: 'book', color: '#10b981' },
  { name: 'Bahasa Inggris', icon: 'languages', color: '#8b5cf6' },
  { name: 'Fisika', icon: 'atom', color: '#f59e0b' },
  { name: 'Kimia', icon: 'flask', color: '#ef4444' },
  { name: 'Biologi', icon: 'microscope', color: '#22c55e' },
  { name: 'Sejarah', icon: 'globe', color: '#f97316' },
  { name: 'Geografi', icon: 'map', color: '#06b6d4' },
];

const demoSubjects: Subject[] = defaultSubjects.map((s, i) => ({
  id: `demo-subject-${i}`,
  user_id: 'demo-user',
  name: s.name,
  icon: s.icon,
  color: s.color,
  order_index: i,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

const iconMap: Record<string, React.ElementType> = {
  calculator: Calculator,
  book: BookOpen,
  languages: Languages,
  atom: Atom,
  flask: FlaskConical,
  microscope: Microscope,
  globe: Globe,
  map: Map,
  default: BookOpen,
};

export function SubjectsPage() {
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setSubjects(demoSubjects);
      setLoading(false);
    } else if (user) {
      fetchSubjects();
    }
  }, [user, isDemoMode]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });

      if (error) throw error;

      if (data && data.length === 0) {
        await createDefaultSubjects();
      } else {
        setSubjects(data as Subject[] || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setLoading(false);
    }
  };

  const createDefaultSubjects = async () => {
    if (!user) return;

    const subjectsToCreate = defaultSubjects.map((subject, index) => ({
      user_id: user.id,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      order_index: index,
    }));

    const { data, error } = await supabase
      .from('subjects')
      .insert(subjectsToCreate)
      .select();

    if (error) {
      console.error('Error creating default subjects:', error);
    } else {
      setSubjects(data as Subject[] || []);
    }
    setLoading(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    if (isDemoMode) {
      const newSubject: Subject = {
        id: `demo-${Date.now()}`,
        user_id: 'demo-user',
        name: newSubjectName.trim(),
        icon: 'book',
        color: '#ec4899',
        order_index: subjects.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
      setIsAddDialogOpen(false);
      return;
    }

    if (!user) return;

    const newSubject = {
      user_id: user.id,
      name: newSubjectName.trim(),
      icon: 'book',
      color: '#ec4899',
      order_index: subjects.length,
    };

    const { data, error } = await supabase
      .from('subjects')
      .insert(newSubject)
      .select()
      .single();

    if (error) {
      console.error('Error adding subject:', error);
    } else if (data) {
      setSubjects([...subjects, data as Subject]);
      setNewSubjectName('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditSubject = async () => {
    if (!selectedSubject || !newSubjectName.trim()) return;

    if (isDemoMode) {
      setSubjects(subjects.map(s =>
        s.id === selectedSubject.id ? { ...s, name: newSubjectName.trim() } : s
      ));
      setNewSubjectName('');
      setSelectedSubject(null);
      setIsEditDialogOpen(false);
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .update({ name: newSubjectName.trim() })
      .eq('id', selectedSubject.id);

    if (error) {
      console.error('Error updating subject:', error);
    } else {
      setSubjects(subjects.map(s =>
        s.id === selectedSubject.id ? { ...s, name: newSubjectName.trim() } : s
      ));
      setNewSubjectName('');
      setSelectedSubject(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;

    if (isDemoMode) {
      setSubjects(subjects.filter(s => s.id !== selectedSubject.id));
      setSelectedSubject(null);
      setIsDeleteDialogOpen(false);
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', selectedSubject.id);

    if (error) {
      console.error('Error deleting subject:', error);
    } else {
      setSubjects(subjects.filter(s => s.id !== selectedSubject.id));
      setSelectedSubject(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setNewSubjectName(subject.name);
    setActionMenuOpen(null);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setActionMenuOpen(null);
    setIsDeleteDialogOpen(true);
  };

  const getIcon = (iconName: string | null) => {
    return iconMap[iconName || 'default'] || iconMap.default;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Subjects</h1>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="p-2 -mr-2 rounded-full hover:bg-pink-50 text-pink-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No subjects yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Add your first subject to get started
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gradient-primary text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => {
              const Icon = getIcon(subject.icon);
              return (
                <Card
                  key={subject.id}
                  className="border-0 shadow-sm rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: subject.color || '#ec4899' }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div
                        className="flex-1 ml-4 cursor-pointer"
                        onClick={() => navigate(`/subjects/${subject.id}`)}
                      >
                        <h3 className="font-semibold text-gray-900">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Tap to view details
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuOpen(
                            actionMenuOpen === subject.id ? null : subject.id
                          )}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>

                        {actionMenuOpen === subject.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[120px]">
                            <button
                              onClick={() => openEditDialog(subject)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteDialog(subject)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        className="w-5 h-5 text-gray-400 ml-2 cursor-pointer"
                        onClick={() => navigate(`/subjects/${subject.id}`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                placeholder="e.g., Computer Science"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewSubjectName('');
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubject}
              disabled={!newSubjectName.trim()}
              className="gradient-primary text-white rounded-xl"
            >
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject-name">Subject Name</Label>
              <Input
                id="edit-subject-name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setNewSubjectName('');
                setSelectedSubject(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubject}
              disabled={!newSubjectName.trim()}
              className="gradient-primary text-white rounded-xl"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedSubject?.name}</strong>?
              This will also delete all notes and recordings for this subject.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedSubject(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSubject}
              variant="destructive"
              className="rounded-xl"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
}
