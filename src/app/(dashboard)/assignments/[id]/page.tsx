'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Clock, Calendar, CheckCircle, Send, Loader2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function AssignmentDetailPage() {
    const router = useRouter()
    const { id } = useParams()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [assignment, setAssignment] = useState<any>(null)
    const [submission, setSubmission] = useState<any>(null)
    const [answer, setAnswer] = useState('')

    useEffect(() => {
        if (id) fetchDetail()
    }, [id])

    const fetchDetail = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch assignment
            const { data: asgn, error: asgnError } = await supabase
                .from('assignments')
                .select('*, classes(name)')
                .eq('id', id)
                .single()

            if (asgnError) throw asgnError
            setAssignment(asgn)

            // Fetch existing submission
            const { data: sub } = await supabase
                .from('submissions')
                .select('*')
                .eq('assignment_id', id)
                .eq('user_id', user.id)
                .single()

            if (sub) {
                setSubmission(sub)
                setAnswer(sub.content || '')
            }

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!answer.trim()) return
        try {
            setSubmitting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('submissions')
                .upsert({
                    assignment_id: id,
                    user_id: user.id,
                    content: answer,
                    status: 'pending',
                    submitted_at: new Date().toISOString()
                })

            if (error) throw error
            alert('Tugas berhasil dikirim!')
            fetchDetail()
        } catch (error) {
            console.error(error)
            alert('Gagal mengirim tugas.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" /></div>
    if (!assignment) return <div className="p-10 text-center text-gray-500">Tugas tidak ditemukan.</div>

    return (
        <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 line-clamp-1">Detail Tugas</h1>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-pink-500 px-2 py-0.5 bg-pink-50 rounded-full">
                            {assignment.classes?.name || 'Umum'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{assignment.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tenggat: {assignment.due_date ? format(new Date(assignment.due_date), 'dd MMM yyyy, HH:mm', { locale: idLocale }) : '-'}</span>
                        </div>
                    </div>
                </div>

                <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Instruksi Tugas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {assignment.description || 'Tidak ada instruksi tambahan.'}
                        </p>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Send className="w-4 h-4 text-pink-500" /> Pengumpulan
                    </h3>
                    <Card className="border-0 shadow-sm rounded-2xl p-4 space-y-4">
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Tulis jawaban atau tautan tugasmu di sini..."
                            className="min-h-[150px] border-gray-100 rounded-xl focus:border-pink-300 focus:ring-pink-200 transition-all text-sm"
                            disabled={submission?.status === 'graded'}
                        />
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !answer.trim() || submission?.status === 'graded'}
                                className="w-full h-11 rounded-xl gradient-primary text-white font-semibold"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                {submission ? 'Perbarui Jawaban' : 'Kirim Sekarang'}
                            </Button>
                            {submission && (
                                <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    Terakhir dikirim: {format(new Date(submission.submitted_at), 'dd MMM, HH:mm', { locale: idLocale })}
                                </p>
                            )}
                        </div>
                    </Card>
                </div>

                {submission?.status === 'graded' && (
                    <Card className="border-0 shadow-sm rounded-2xl bg-green-50/50 border-t-2 border-t-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-green-800">Nilai & Umpan Balik</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-green-600">{submission.grade}</span>
                                <span className="text-xs text-green-700/60">/ 100</span>
                            </div>
                            {submission.feedback && (
                                <p className="text-xs text-green-700 leading-relaxed italic">
                                    "{submission.feedback}"
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
