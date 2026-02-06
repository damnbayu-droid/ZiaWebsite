'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Timer, Trophy, ArrowLeft, RefreshCw, Zap, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function MathBlitz({ onBack }: { onBack: () => void }) {
    const supabase = createClient()
    const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start')
    const [score, setScore] = useState(0)
    const [timeLeft, setTimeLeft] = useState(30)
    const [problem, setProblem] = useState({ q: '', a: 0 })
    const [userAnswer, setUserAnswer] = useState('')
    const [multiplier, setMultiplier] = useState(1)
    const [streak, setStreak] = useState(0)
    const [totalXP, setTotalXP] = useState(0)

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
            return () => clearInterval(timer)
        } else if (timeLeft === 0 && gameState === 'playing') {
            finishGame()
        }
    }, [gameState, timeLeft])

    const generateProblem = () => {
        const ops = ['+', '-', '*']
        const op = ops[Math.floor(Math.random() * ops.length)]
        let a, b, ans

        if (op === '*') {
            a = Math.floor(Math.random() * 12) + 2
            b = Math.floor(Math.random() * 12) + 2
            ans = a * b
        } else {
            a = Math.floor(Math.random() * 50) + 1
            b = Math.floor(Math.random() * 50) + 1
            ans = op === '+' ? a + b : a - b
        }

        setProblem({ q: `${a} ${op === '*' ? '×' : op} ${b}`, a: ans })
    }

    const startGame = () => {
        setScore(0)
        setTimeLeft(30)
        setStreak(0)
        setMultiplier(1)
        setGameState('playing')
        generateProblem()
    }

    const handleAnswer = (e: React.FormEvent) => {
        e.preventDefault()
        const ans = parseInt(userAnswer)
        if (ans === problem.a) {
            const points = 10 * multiplier
            setScore(prev => prev + points)
            setStreak(prev => prev + 1)
            if ((streak + 1) % 5 === 0) setMultiplier(prev => Math.min(prev + 0.5, 3))

            // Effect
            confetti({
                particleCount: 20,
                startVelocity: 30,
                spread: 360,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: ['#fbbf24', '#f59e0b']
            })
        } else {
            setStreak(0)
            setMultiplier(1)
        }
        setUserAnswer('')
        generateProblem()
    }

    const finishGame = async () => {
        setGameState('result')
        const xp = Math.floor(score * 1.5)
        setTotalXP(xp)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Update scores
            await supabase.from('arena_scores').insert({
                user_id: user.id,
                score: score,
                xp_gained: xp
            })

            // Update profiles - simple update for demo
            const { data: prof } = await supabase.from('arena_profiles').select('total_xp').eq('user_id', user.id).single()
            if (prof) {
                await supabase.from('arena_profiles').update({
                    total_xp: prof.total_xp + xp,
                    updated_at: new Date().toISOString()
                }).eq('user_id', user.id)
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900">
            <AnimatePresence mode="wait">
                {gameState === 'start' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="w-24 h-24 bg-yellow-500 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                                <Zap className="w-12 h-12 text-white fill-current" />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter">MATH BLITZ</h1>
                            <p className="text-gray-400 max-w-xs mx-auto">Jawab soal matematika secepat mungkin dalam 30 detik. Tingkatkan streak untuk poin ekstra!</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={startGame} className="h-16 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-black font-black text-xl px-12 shadow-xl">
                                MULAI MAIN
                            </Button>
                            <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                            </Button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'playing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full max-w-md space-y-8"
                    >
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                                <span className="text-2xl font-black mono">{timeLeft}s</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase text-gray-400 font-bold">Skor Kamu</p>
                                    <p className="text-2xl font-black text-yellow-500">{score}</p>
                                </div>
                                <button
                                    onClick={() => confirm('Keluar dari game?') && onBack()}
                                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="text-center py-12 relative">
                            <AnimatePresence mode="wait">
                                <motion.h2
                                    key={problem.q}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-7xl font-black tracking-tight"
                                >
                                    {problem.q}
                                </motion.h2>
                            </AnimatePresence>
                            {multiplier > 1 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-4 right-0 bg-pink-600 text-[10px] font-black px-2 py-1 rounded-lg"
                                >
                                    COMBO x{multiplier}
                                </motion.div>
                            )}
                        </div>

                        <form onSubmit={handleAnswer} className="space-y-4">
                            <Input
                                autoFocus
                                type="number"
                                value={userAnswer}
                                onChange={e => setUserAnswer(e.target.value)}
                                className="h-20 bg-white/10 border-0 rounded-3xl text-center text-4xl font-black focus-visible:ring-yellow-500"
                            />
                            <p className="text-center text-xs text-gray-500">Tekan ENTER untuk menjawab</p>
                        </form>
                    </motion.div>
                )}

                {gameState === 'result' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8"
                    >
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
                        <div>
                            <h2 className="text-3xl font-black mb-2">Game Selesai!</h2>
                            <p className="text-gray-400">Kecepatan hitung kamu luar biasa.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Skor</p>
                                <p className="text-2xl font-black text-yellow-500">{score}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">XP</p>
                                <p className="text-2xl font-black text-blue-400">+{totalXP}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={startGame} className="h-14 rounded-2xl bg-white text-black font-black px-12">
                                MAIN LAGI <RefreshCw className="w-4 h-4 ml-2" />
                            </Button>
                            <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
                                Kembali ke Arena
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
