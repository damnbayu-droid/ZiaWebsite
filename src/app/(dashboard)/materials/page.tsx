'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Image as ImageIcon, Trash2, Plus, Loader2, Download, File, Clock, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export default function MaterialsPage() {
    const supabase = createClient()
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const [uploading, setUploading] = useState(false)
    const [title, setTitle] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchMaterials()
    }, [])

    const fetchMaterials = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMaterials(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileInputRef.current?.files?.length || !title) return

        try {
            setUploading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const file = fileInputRef.current.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Note: Materials bucket is private, so we need signed URL or own check
            // But typically for simple use we might use Public, or signed URL.
            // Schema says 'materials' bucket public is false.
            // So detailed view needs to generate signed URL. 
            // For now, let's store the path and generate signed URL on demand? 
            // Or just store publicUrl if we decide to make it public?
            // The requirement "Private" implies signed URLs.

            // Let's store the PATH (fileName) in file_url for signed generation,
            // OR generate a long-lived signed URL? 
            // Supabase storage paths are best stored as path.

            // Attempting to just store path for now.

            const { error: dbError } = await supabase.from('materials').insert({
                user_id: user.id,
                title: title,
                file_url: fileName, // Storing path
                file_type: file.type
            })

            if (dbError) throw dbError

            alert('Berhasil diunggah!')
            setIsOpen(false)
            setTitle('')
            if (fileInputRef.current) fileInputRef.current.value = ''
            fetchMaterials()
        } catch (error) {
            console.error(error)
            alert('Gagal mengunggah file.')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string, path: string) => {
        if (!confirm('Hapus file ini?')) return
        try {
            await supabase.storage.from('materials').remove([path])
            await supabase.from('materials').delete().eq('id', id)
            setMaterials(p => p.filter(m => m.id !== id))
        } catch (e) {
            console.error(e)
        }
    }

    const getIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />
        if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
        return <File className="w-5 h-5 text-blue-500" />
    }

    const openFile = async (path: string) => {
        // Generate signed URL
        const { data, error } = await supabase.storage.from('materials').createSignedUrl(path, 60 * 60) // 1 hour
        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank')
        } else {
            alert('Gagal membuka file')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900">Materi Belajar</h1>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-pink-500 hover:bg-pink-600">
                            <Plus className="w-5 h-5 text-white" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Unggah Materi</DialogTitle>
                            <DialogDescription>Simpan PDF atau gambar pelajaran.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nama File</Label>
                                <Input id="title" placeholder="Contoh: Modul Matematika" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">Pilih File</Label>
                                <Input id="file" type="file" ref={fileInputRef} accept=".pdf,image/*,.doc,.docx" />
                            </div>
                            <Button type="submit" disabled={uploading} className="w-full rounded-xl gradient-primary text-white">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unggah'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {loading ? <p className="text-center text-gray-500">Memuat...</p> :
                    materials.length === 0 ? <div className="text-center py-20 text-gray-500"><File className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Belum ada materi.</p></div> :
                        materials.map(mat => (
                            <Card key={mat.id} className="p-4 flex items-center gap-4 border-0 shadow-sm rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => openFile(mat.file_url)}>
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {getIcon(mat.file_type || '')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{mat.title}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(mat.created_at), 'dd MMM yyyy', { locale: idLocale })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(mat.id, mat.file_url); }}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </Card>
                        ))
                }
            </main>
        </div>
    )
}
