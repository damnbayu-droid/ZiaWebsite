import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { openClaw, OpenClawMessage } from '@/lib/openclaw'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        // 1. Security Check: Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { message, history } = body

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        // 2. Context Building (Zia Backend Role)
        // Fetch recent notes or assignments to give AI context
        // We limit this to prevent token explosion

        const { data: notes } = await supabase
            .from('notes')
            .select('title, content')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(3)

        const { data: assignments } = await supabase
            .from('assignments')
            .select('title, status, due_date')
            .eq('user_id', user.id)
            .eq('status', 'open')
            .limit(5)

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, grade, school')
            .eq('id', user.id)
            .single()

        // 3. Construct Message History
        // We trust the history passed from client strictly for conversation flow,
        // but critical context is injected server-side.
        const conversation: OpenClawMessage[] = [
            {
                role: 'system',
                content: `You are Zia, an educational AI assistant for high school students.
                User: ${profile?.full_name} (${profile?.grade}).
                Tone: Encouraging, concise, educational.
                Context:
                - Active Assignments: ${assignments?.map(a => a.title).join(', ') || 'None'}
                - Recent Notes: ${notes?.map(n => n.title).join(', ') || 'None'}
                
                Answer strictly based on educational needs.`
            },
            ...(history || []),
            { role: 'user', content: message }
        ]

        // 4. Delegate to OpenClaw Service
        const aiResponse = await openClaw.sendMessage(conversation, {
            userId: user.id,
            notes: notes?.map(n => n.content) || [],
            userProfile: profile
        })

        // 5. Log Interaction (Light logging)
        // Ideally handled by OpenClaw, but we keep a record in Zia too
        /* 
        await supabase.from('ai_logs').insert({
            user_id: user.id,
            prompt: message,
            response: aiResponse
        }) 
        */

        return NextResponse.json({
            response: aiResponse
        })

    } catch (error: any) {
        console.error('[API/AI] Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
