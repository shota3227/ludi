import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        const missing = []
        if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
        if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY')
        throw new Error(`設定不備: ${missing.join(' と ')} が見つかりません。VercelのSettings > Environment Variables を確認してください。`)
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
