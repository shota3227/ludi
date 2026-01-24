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
        throw new Error(`設定不備: ${missing.join(' と ')} が見つかりません。`)
    }

    // 鍵の形式チェック（anonキーとservice_roleキーの取り違え防止）
    // 通常、anonキーよりもservice_roleキーの方が権限が強いため、auth.adminで使用されます。
    if (key.length < 50) {
        throw new Error('設定エラー: SUPABASE_SERVICE_ROLE_KEY が短すぎます。正しくコピーできているか確認してください。')
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
