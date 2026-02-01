'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Camera, ScanText, Copy, Check } from 'lucide-react'
import Tesseract from 'tesseract.js'

export default function ScanPage() {
    const [scanning, setScanning] = useState(false)
    const [scannedText, setScannedText] = useState('')
    const [image, setImage] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImage(ev.target.result as string)
                    performOCR(file)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const performOCR = async (file: File) => {
        try {
            setScanning(true)
            setScannedText('')

            const result = await Tesseract.recognize(
                file,
                'eng+ind', // English and Indonesian
                {
                    logger: m => console.log(m)
                }
            )

            setScannedText(result.data.text)
        } catch (error) {
            console.error(error)
            alert('Gagal memindai teks.')
        } finally {
            setScanning(false)
        }
    }

    const copyText = () => {
        navigator.clipboard.writeText(scannedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 safe-area-inset-bottom">
            <header className="bg-white px-4 py-4 sticky top-0 z-10 safe-area-inset-top shadow-sm">
                <h1 className="text-lg font-bold text-gray-900">Pindai Pintar (OCR)</h1>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

                <Card className="p-6 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-200 bg-white rounded-2xl">
                    {image ? (
                        <img src={image} alt="Preview" className="max-h-64 object-contain rounded-lg mb-4" />
                    ) : (
                        <div className="text-center space-y-2">
                            <ScanText className="w-12 h-12 text-gray-300 mx-auto" />
                            <p className="text-sm text-gray-500">Ambil foto buku atau catatan</p>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        ref={inputRef}
                        className="hidden"
                        onChange={handleImageUpload}
                        capture="environment"
                    />

                    <Button onClick={() => inputRef.current?.click()} disabled={scanning} className="mt-4 rounded-full gradient-primary text-white pl-4 pr-5">
                        {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                        {scanning ? 'Memindai...' : image ? 'Foto Ulang' : 'Mulai Pindai'}
                    </Button>
                </Card>

                {scannedText && (
                    <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">Hasil Pindai</h3>
                            <Button variant="ghost" size="sm" onClick={copyText} className="text-pink-600 hover:bg-pink-50">
                                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                                {copied ? 'Disalin' : 'Salin'}
                            </Button>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {scannedText}
                        </div>
                    </Card>
                )}

            </main>
        </div>
    )
}
