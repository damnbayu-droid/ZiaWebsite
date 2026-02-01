import { createClient } from '@/lib/supabase/server'

// Live OpenAI Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface OpenClawMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface OpenClawContext {
    userId: string
    notes?: string[]
    assignments?: string[]
    userProfile?: any
}

class OpenClawClient {
    /**
     * Sends a message to the OpenAI API (acting as OpenClaw Backend).
     * This runs SERVER-SIDE only.
     */
    async sendMessage(
        messages: OpenClawMessage[],
        context: OpenClawContext
    ): Promise<string> {
        if (!OPENAI_API_KEY) {
            console.error('[OpenClaw] Missing OPENAI_API_KEY')
            throw new Error('AI Service Configuration Error')
        }

        try {
            console.log(`[OpenClaw] Sending request for user ${context.userId} (Live OpenAI)`)

            const payload = {
                model: "gpt-4o-mini", // Using lightweight model as requested
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                user: context.userId // Context isolation tracking
            }

            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                // Do not expose raw API key or full error to client, log server-side
                console.error(`[OpenClaw/OpenAI] Error ${response.status}: ${errorText}`)
                throw new Error(`AI Service temporarily unavailable.`)
            }

            const data = await response.json()
            return data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat menjawab saat ini."

        } catch (error) {
            console.error('[OpenClaw] API Error:', error)
            throw error // No simulation fallback, strict failure
        }
    }
}

export const openClaw = new OpenClawClient()
