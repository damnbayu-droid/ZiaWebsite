'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    Timer,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Trophy,
    ChevronLeft,
    Sparkles,
    Zap,
    Share2,
    Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Question {
    id: string
    question: string
    options: string[]
    correct_answer: string
    explanation?: string
    points: number
}

export function TriviaGame({ arenaSlug, onBack, profile }: { arenaSlug: string, onBack: () => void, profile: any }) {
    const supabase = createClient()
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [timeLeft, setTimeLeft] = useState(15)
    const [gameState, setGameState] = useState<'loading' | 'starting' | 'playing' | 'result'>('loading')
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [totalXP, setTotalXP] = useState(0)

    // Fallback questions if database is empty
    const fallbackQuestions: Record<string, Question[]> = {
        'english-duel': [
            { id: '1', question: 'What is the past tense of "Go"?', options: ['Went', 'Gone', 'Goes', 'Going'], correct_answer: 'Went', points: 10, explanation: '"Went" adalah irregular verb bentuk lampau dari "Go".' },
            { id: '2', question: 'Which one is a synonym of "Smart"?', options: ['Dull', 'Intelligent', 'Slow', 'Quiet'], correct_answer: 'Intelligent', points: 10, explanation: '"Intelligent" memiliki arti yang sama dengan "Smart".' },
            { id: '3', question: 'I ... eating breakfast when the bell rang.', options: ['Am', 'Was', 'Were', 'Is'], correct_answer: 'Was', points: 15, explanation: 'Past Continuous menggunakan was/were. "I" berpasangan dengan "was".' }
        ],
        'cerdas-cermat': [
            { id: '1', question: 'Siapa Bapak Proklamator Indonesia?', options: ['B.J. Habibie', 'Soekarno', 'Suharto', 'Gus Dur'], correct_answer: 'Soekarno', points: 10 },
            { id: '2', question: 'Ibu Kota Nusantara (IKN) terletak di provinsi?', options: ['Jawa Barat', 'Kalimantan Timur', 'Sulawesi Utara', 'Papua'], correct_answer: 'Kalimantan Timur', points: 10 },
            { id: '3', question: 'Lagu "Indonesia Raya" pertama kali dikumandangkan pada?', options: ['17 Agustus 1945', '28 Oktober 1928', '1 Juni 1945', '20 Mei 1908'], correct_answer: '28 Oktober 1928', points: 15, explanation: 'Dikandangkan pada peristiwa Sumpah Pemuda.' }
        ]
    }

    useEffect(() => {
        fetchQuestions()
    }, [arenaSlug])

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0 && !selectedAnswer) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
            return () => clearTimeout(timer)
        } else if (timeLeft === 0 && gameState === 'playing') {
            handleAnswer('') // Time's up
        }
    }, [timeLeft, gameState, selectedAnswer])

    const fetchQuestions = async () => {
        setGameState('loading')
        try {
            const { data: arena } = await supabase.from('arenas').select('id').eq('slug', arenaSlug).single()
            if (arena) {
                const { data: qs } = await supabase
                    .from('arena_questions')
                    .select('*')
                    .eq('arena_id', arena.id)
                    .limit(10)

                if (qs && qs.length > 0) {
                    setQuestions(qs)
                } else {
                    setQuestions(fallbackQuestions[arenaSlug] || [])
                }
            } else {
                setQuestions(fallbackQuestions[arenaSlug] || [])
            }
            setGameState('starting')
            setTimeout(() => setGameState('playing'), 2000)
        } catch (e) {
            setQuestions(fallbackQuestions[arenaSlug] || [])
            setGameState('playing')
        }
    }

    const handleAnswer = (answer: string) => {
        if (selectedAnswer) return
        setSelectedAnswer(answer)
        const currentQ = questions[currentIndex]
        const correct = answer === currentQ.correct_answer
        setIsCorrect(correct)

        if (correct) {
            const pointsGained = currentQ.points + Math.floor(timeLeft / 2) // Bonus for speed
            setScore(score + pointsGained)
            setTotalXP(totalXP + pointsGained)
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1)
                setSelectedAnswer(null)
                setIsCorrect(null)
                setTimeLeft(15)
            } else {
                finishGame()
            }
        }, 2000)
    }

    const getDifficultyLevel = (xp: number) => {
        if (xp <= 100) return { label: 'Sangat Mudah', color: 'text-green-400', multiplier: 1 }
        if (xp <= 300) return { label: 'Mudah', color: 'text-blue-400', multiplier: 1.2 }
        if (xp <= 600) return { label: 'Normal', color: 'text-yellow-400', multiplier: 1.5 }
        if (xp <= 1000) return { label: 'Susah', color: 'text-orange-400', multiplier: 2 }
        if (xp <= 2000) return { label: 'Sangat Susah', color: 'text-red-400', multiplier: 3 }
        return { label: 'Expert', color: 'text-purple-400', multiplier: 5 }
    }

    const currentDiff = getDifficultyLevel(profile?.total_xp || 0)

    const finishGame = async () => {
        setGameState('result')
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ec4899', '#6366f1', '#f59e0b']
        })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: arena } = await supabase.from('arenas').select('id').eq('slug', arenaSlug).single()

            const finalXP = Math.floor(totalXP * currentDiff.multiplier)

            await supabase.from('arena_scores').insert({
                user_id: user.id,
                arena_id: arena?.id,
                score: score,
                xp_gained: finalXP
            })

            const { data: prof } = await supabase.from('arena_profiles').select('total_xp, games_played, games_won').eq('user_id', user.id).single()

            if (prof) {
                await supabase.from('arena_profiles').update({
                    total_xp: prof.total_xp + finalXP,
                    games_played: prof.games_played + 1,
                    games_won: score > 30 ? prof.games_won + 1 : prof.games_won,
                    updated_at: new Date().toISOString()
                }).eq('user_id', user.id)
            } else {
                await supabase.from('arena_profiles').insert({
                    user_id: user.id,
                    total_xp: finalXP,
                    games_played: 1,
                    games_won: score > 30 ? 1 : 0
                })
            }
            setTotalXP(finalXP) // Update for display
        } catch (e) {
            console.error('Failed to save score:', e)
        }
    }

    if (gameState === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
    )

    if (gameState === 'starting') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-pink-500 flex items-center justify-center mb-8"
            >
                <Zap className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black mb-2">Siap?</h1>
            <p className="text-gray-400 text-center">Menyiapkan arena {arenaSlug.replace('-', ' ')}...</p>
        </div>
    )

    if (gameState === 'result') return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center text-center">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-6 w-full max-w-sm"
            >
                <div className="relative inline-block">
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute -inset-4 border-2 border-dashed border-yellow-500/30 rounded-full"
                    />
                </div>

                <div>
                    <h1 className="text-4xl font-black mb-2">Game Selesai!</h1>
                    <p className="text-gray-400">Kerja bagus, Zia kebanggaan sekolah!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Skor Akhir</p>
                        <p className="text-3xl font-black text-pink-500">{score}</p>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-4 border border-white/10">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">XP Diraih</p>
                        <p className="text-3xl font-black text-blue-400">+{totalXP}</p>
                    </div>
                </div>

                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 ${currentDiff.color} text-sm font-bold`}>
                    <Sparkles className="w-4 h-4" />
                    Tingkat: {currentDiff.label} (x{currentDiff.multiplier})
                </div>

                <div className="space-y-3 pt-4">
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-lg"
                    >
                        Main Lagi <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        className="w-full h-14 text-gray-400 hover:text-white"
                    >
                        Kembali ke Hub
                    </Button>
                </div>

                <button className="flex items-center gap-2 mx-auto text-xs text-gray-500 hover:text-pink-400 transition-colors">
                    <Share2 className="w-3 h-3" /> Bagikan Skor ke Teman
                </button>
            </motion.div>
        </div>
    )

    const currentQ = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
        <div className="min-h-screen bg-gray-900 text-white safe-area-inset-bottom">
            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/5">
                <button
                    onClick={() => confirm('Berhenti main?') && onBack()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-white/10"
                >
                    <XCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Keluar</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Soal {currentIndex + 1}/{questions.length}</span>
                    <div className="flex items-center gap-2">
                        <Timer className={`w-4 h-4 ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-pink-500'}`} />
                        <span className={`font-mono font-bold ${timeLeft < 5 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
                    </div>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{score}</span>
                </div>
            </header>

            <Progress value={progress} className="h-1 rounded-none bg-white/5" indicatorClassName="bg-pink-500" />

            <main className="max-w-lg mx-auto p-6 space-y-8 h-[calc(100vh-120px)] flex flex-col">
                {/* Question Section */}
                <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="space-y-4"
                        >
                            <Badge variant="outline" className="border-pink-500/30 text-pink-400 bg-pink-500/5">
                                {arenaSlug === 'english-duel' ? 'English Mastery' : 'Cerdas Cermat'}
                            </Badge>
                            <h2 className="text-2xl font-bold leading-tight">
                                {currentQ?.question}
                            </h2>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3 pb-8">
                    {currentQ?.options.map((option) => {
                        const isSelected = selectedAnswer === option
                        const showCorrect = selectedAnswer && (option === currentQ.correct_answer)
                        const showWrong = isSelected && !isCorrect

                        return (
                            <button
                                key={option}
                                onClick={() => handleAnswer(option)}
                                disabled={!!selectedAnswer}
                                className={`
                                    w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between
                                    ${isSelected ? 'scale-[0.98]' : 'active:scale-[0.98]'}
                                    ${!selectedAnswer ? 'border-white/10 hover:border-pink-500/50 bg-white/5' : ''}
                                    ${showCorrect ? 'border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : ''}
                                    ${showWrong ? 'border-red-500 bg-red-500/20 text-red-400' : ''}
                                    ${selectedAnswer && !showCorrect && !showWrong ? 'border-white/5 opacity-50 bg-transparent' : ''}
                                `}
                            >
                                <span className="flex-1">{option}</span>
                                {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                                {showWrong && <XCircle className="w-6 h-6 text-red-500" />}
                            </button>
                        )
                    })}
                </div>

                {/* Explanation / Footer */}
                <AnimatePresence>
                    {selectedAnswer && currentQ.explanation && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs flex gap-3"
                        >
                            <Sparkles className="w-8 h-8 flex-shrink-0 text-indigo-400" />
                            <p><strong>Tahukah Kamu?</strong><br />{currentQ.explanation}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
