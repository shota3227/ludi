'use server'

import { getSupabaseAdmin } from './supabase-admin'
import { createUser } from './database'
import type { User } from '@/types'

export async function adminCreateUserAction(userData: {
    email: string
    password: string
    name: string
    nickname: string
    role: User['role']
    primary_store_id: string
}) {
    try {
        const supabase = getSupabaseAdmin()

        // 1. Auth ユーザーの作成 (Service Roleを使用)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
                name: userData.name,
                role: userData.role
            }
        })

        if (authError) {
            console.error('Admin Auth Error:', authError)
            return { success: false, error: authError.message }
        }

        if (!authData.user) {
            return { success: false, error: 'User creation failed in Auth' }
        }

        // 2. DB ユーザーの作成
        const dbUser = await createUser({
            email: userData.email,
            name: userData.name,
            nickname: userData.nickname || userData.name,
            role: userData.role,
            primary_store_id: userData.primary_store_id,
            auth_id: authData.user.id,
        })

        if (!dbUser) {
            return { success: false, error: 'User metadata could not be saved to database' }
        }

        return { success: true, user: dbUser }
    } catch (error: any) {
        console.error('Server Action Error:', error)
        return { success: false, error: error.message || 'Internal server error' }
    }
}
