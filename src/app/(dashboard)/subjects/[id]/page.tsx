import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { BookOpen, FileText, Calendar, Download, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// Define types since we don't have global types yet
interface Subject {
    id: string
    name: string
    icon: string
    color: string
}

interface Assignment {
    id: string
    title: string
    description: string
    due_date: string
    status: 'open' | 'submitted' | 'reviewed' | 'done'
}

interface Material {
    id: string
    title: string
    file_url: string
    file_type: string
    created_at: string
}

export default async function SubjectDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Subject
    const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single()

    if (subjectError || !subject) {
        notFound()
    }

    // 2. Fetch Assignments
    const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', id)
        .order('due_date', { ascending: true })

    // 3. Fetch Materials
    const { data: materials } = await supabase
        .from('materials')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: subject.color || '#db2777' }}
                    >
                        <BookOpen className="w-6 h-6" />
                    </div>
                    {subject.name}
                </h1>
                <p className="text-gray-500 text-sm ml-14">
                    Detail mata pelajaran, tugas, dan materi pembelajaran.
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-pink-50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm">Ringkasan</TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm">Tugas</TabsTrigger>
                    <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm">Materi</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-0 shadow-sm bg-blue-50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Total Materi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-blue-900">{materials?.length || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-sm bg-purple-50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" /> Tugas Aktif
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-purple-900">
                                    {assignments?.filter((a: any) => a.status === 'open').length || 0}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tentang Mata Pelajaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Belum ada deskripsi untuk mata pelajaran ini. Hubungi guru pengampu untuk informasi lebih lanjut.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ASSIGNMENTS TAB */}
                <TabsContent value="assignments" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {assignments && assignments.length > 0 ? (
                        <div className="grid gap-4">
                            {assignments.map((assignment: Assignment) => (
                                <Card key={assignment.id} className="border-l-4 border-l-pink-500 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-semibold text-gray-800">
                                                {assignment.title}
                                            </CardTitle>
                                            <Badge variant={assignment.status === 'done' ? 'default' : 'secondary'} className={assignment.status === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                                                {assignment.status === 'open' ? 'Aktif' : 'Selesai'}
                                            </Badge>
                                        </div>
                                        <CardDescription className="line-clamp-2">
                                            {assignment.description || 'Tidak ada deskripsi tambahan.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Batas: {assignment.due_date ? format(new Date(assignment.due_date), 'dd MMM HH:mm', { locale: idLocale }) : '-'}</span>
                                            </div>
                                            {/* Action Button Placeholder */}
                                            <Button size="sm" variant="outline" className="ml-auto h-8 text-xs border-pink-200 text-pink-600 hover:bg-pink-50">
                                                Lihat Detail
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 font-medium">Tidak Ada Tugas</h3>
                            <p className="text-gray-500 text-sm">Belum ada tugas yang diberikan untuk mata pelajaran ini.</p>
                        </div>
                    )}
                </TabsContent>

                {/* MATERIALS TAB */}
                <TabsContent value="materials" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {materials && materials.length > 0 ? (
                        <div className="grid gap-3">
                            {materials.map((file: Material) => (
                                <div key={file.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                                            <FileText className="w-5 h-5 text-gray-500 group-hover:text-pink-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 text-sm group-hover:text-pink-700 transition-colors">
                                                {file.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                                {file.file_type || 'Dokumen'} • {format(new Date(file.created_at), 'dd MMM yyyy', { locale: idLocale })}
                                            </p>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-gray-400 hover:text-pink-600">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 font-medium">Belum Ada Materi</h3>
                            <p className="text-gray-500 text-sm">Guru belum mengunggah materi pembelajaran.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
