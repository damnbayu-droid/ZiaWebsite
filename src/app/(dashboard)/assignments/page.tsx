'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function AssignmentsPage() {
    const supabase = createClient()
    const [assignments, setAssignments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('assignments')
                .select(`
          id, title, due_date, status, subjects(name, color)
        `)
                .order('due_date', { ascending: true })

            if (error) {
                console.error('Supabase Error:', error)
                throw error
            }
            setAssignments(data || [])
        } catch (error: any) {
            console.error('Fetch Error:', error.message || error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Tugas</h1>
                <Link href="/assignments/new">
                    <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                        <Plus className="w-5 h-5 text-white" />
                    </Button>
                </Link>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? <p className="text-center text-sm text-gray-500">Memuat tugas...</p> :
                    assignments.length === 0 ? <p className="text-center text-gray-500">Tidak ada tugas aktif.</p> :
                        assignments.map(assignment => (
                            <Card key={assignment.id} className="border-0 shadow-sm rounded-2xl overflow-hidden p-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${assignment.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                        {assignment.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900">{assignment.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-medium">{assignment.subjects?.name}</span>
                                            {assignment.due_date && <span className="text-[10px] text-gray-400">{format(new Date(assignment.due_date), 'dd MMM HH:mm', { locale: idLocale })}</span>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                }
            </main>
        </div>
    )
}
