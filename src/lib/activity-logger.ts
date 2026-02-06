import { createClient } from '@/lib/supabase/client'

export type ActivityAction =
    | 'login'
    | 'logout'
    | 'view_assignment'
    | 'create_assignment'
    | 'complete_assignment'
    | 'create_note'
    | 'edit_note'
    | 'delete_note'
    | 'view_material'
    | 'play_game'
    | 'send_message'
    | 'update_profile'
    | 'join_class'
    | 'leave_class'
    | 'view_barcode'
    | 'download_id_card'

export async function logActivity(
    action: ActivityAction,
    details?: Record<string, any>
) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Get user's full name for the log
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        await supabase.from('activity_logs').insert({
            user_id: user.id,
            user_name: profile?.full_name || 'Unknown User',
            action,
            details: details || {},
            created_at: new Date().toISOString()
        })
    } catch (error) {
        // Silently fail - don't break the app if logging fails
        console.error('Activity logging failed:', error)
    }
}

// Helper to log page views
export async function logPageView(page: string) {
    await logActivity('view_assignment', { page })
}
