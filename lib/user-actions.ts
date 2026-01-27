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

        // 2. DB ユーザーの作成 (ID同期を解除し、DB側の自動生成に委ねる)
        const { data: dbData, error: dbError } = await supabase
            .from('users')
            .insert({
                email: userData.email,
                name: userData.name,
                nickname: userData.nickname || userData.name,
                role: userData.role,
                primary_store_id: userData.primary_store_id,
                auth_id: authData.user.id, // 認証IDとの紐付けは維持
                avatar_id: 'default_01',
                rank: 1,
                is_active: true,
            })
            .select()
            .single()

        if (dbError) {
            console.error('Admin DB Error:', dbError)
            return { success: false, error: `データベース保存エラー: ${dbError.message}` }
        }

        return { success: true, user: dbData as unknown as User }
    } catch (error: any) {
        console.error('Server Action Error:', error)
        return { success: false, error: error.message || 'Internal server error' }
    }
}

export async function adminGetAllUsersAction() {
    try {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, users: data as User[] }
    } catch (error: any) {
        console.error('Admin Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

export async function adminGetStoreMembersAction(storeId: string) {
    try {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('primary_store_id', storeId)
            .eq('is_active', true)
            .order('rank', { ascending: false })

        if (error) throw error
        return { success: true, users: data as User[] }
    } catch (error: any) {
        console.error('Admin Store Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

// ユーザー同期用：全Authユーザーの取得
export async function adminGetAllAuthUsersAction() {
    try {
        const supabase = getSupabaseAdmin()
        // ページネーションが必要な場合は考慮が必要ですが、まずは1000件取得
        const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

        if (error) throw error
        // 必要な情報だけ返す
        const users = data.users.map((u: any) => ({
            id: u.id,
            email: u.email
        }))
        return { success: true, users }
    } catch (error: any) {
        console.error('Admin Auth Fetch Error:', error)
        return { success: false, error: error.message }
    }
}

// ユーザー同期用：ゴーストユーザー（Authに存在しないユーザー）の削除
export async function adminDeleteGhostUsersAction(userIds: string[]) {
    if (!userIds.length) return { success: true }

    try {
        const supabase = getSupabaseAdmin()
        // DBから削除（関連データもCASCADE削除されることを期待、または別途削除が必要か要確認だが、通常はusers削除でOK）
        const { error } = await supabase
            .from('users')
            .delete()
            .in('id', userIds)

        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error('Admin Ghost Delete Error:', error)
        return { success: false, error: error.message }
    }
}

// デバッグ用：テスト管理者作成
export async function debugCreateTestAdminAction() {
    try {
        const supabase = getSupabaseAdmin()
        const email = 'test-admin@luvir.com'
        const password = 'password123'

        // Authユーザー作成
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        let userId = authData?.user?.id

        if (authError) {
            // 既に存在する場合はID再取得
            if (authError.message.includes('already registered')) {
                const { data: list } = await supabase.auth.admin.listUsers()
                const existing = list.users.find((u: any) => u.email === email)
                if (existing) userId = existing.id
            } else {
                throw authError
            }
        }

        if (!userId) throw new Error('Failed to get User ID')

        // 店舗ID取得
        const { data: store } = await supabase.from('stores').select('id').limit(1).single()
        const storeId = store?.id

        if (!storeId) throw new Error('Store not found')

        // DBユーザー更新/作成
        const { error: dbError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                auth_id: userId,
                email: email,
                name: 'テスト管理者',
                nickname: 'AdminTester',
                role: 'system_admin',
                primary_store_id: storeId,
                avatar_id: 'default_01',
                rank: 100,
                is_active: true,
                updated_at: new Date().toISOString()
            })

        if (dbError) throw dbError

        return { success: true }
    } catch (error: any) {
        console.error('Debug Create Error:', error)
        return { success: false, error: error.message }
    }
}
