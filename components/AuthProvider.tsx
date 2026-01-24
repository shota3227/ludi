'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, getCurrentAuthUser } from '@/lib/supabase'
import { getUserByAuthId, getCurrentAttendance, getUnreadCount, getStore } from '@/lib/database'
import { useAuthStore, useAttendanceStore, useNotificationStore } from '@/lib/store'
import { Loading } from '@/components/common'

interface AuthProviderProps {
  children: ReactNode
}

// 認証不要なパス
const PUBLIC_PATHS = ['/login', '/signup']

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, setUser, setStore, setLoading } = useAuthStore()
  const { setAttendance } = useAttendanceStore()
  const { setUnreadCount } = useNotificationStore()

  useEffect(() => {
    // 初期認証チェック
    const checkAuth = async () => {
      try {
        const authUser = await getCurrentAuthUser()
        
        if (authUser) {
          // DBからユーザー情報を取得
          const dbUser = await getUserByAuthId(authUser.id)
          
          if (dbUser) {
            setUser(dbUser)
            
            // 店舗情報を取得
            if (dbUser.primary_store_id) {
              const store = await getStore(dbUser.primary_store_id)
              setStore(store)
            }
            
            // 勤怠状態を取得
            const attendance = await getCurrentAttendance(dbUser.id)
            setAttendance(attendance)
            
            // 未読通知数を取得
            const unread = await getUnreadCount(dbUser.id)
            setUnreadCount(unread)
          } else {
            // DBにユーザーがいない場合はログアウト
            await supabase.auth.signOut()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const dbUser = await getUserByAuthId(session.user.id)
        if (dbUser) {
          setUser(dbUser)
          if (dbUser.primary_store_id) {
            const store = await getStore(dbUser.primary_store_id)
            setStore(store)
          }
          const attendance = await getCurrentAttendance(dbUser.id)
          setAttendance(attendance)
          const unread = await getUnreadCount(dbUser.id)
          setUnreadCount(unread)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setStore(null)
        setAttendance(null)
        setUnreadCount(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // リダイレクト処理
  useEffect(() => {
    if (isLoading) return

    const isPublicPath = PUBLIC_PATHS.includes(pathname)

    if (!user && !isPublicPath) {
      router.push('/login')
    } else if (user && isPublicPath) {
      router.push('/')
    }
  }, [user, isLoading, pathname, router])

  // ローディング中
  if (isLoading) {
    return <Loading message="認証確認中..." />
  }

  // 未認証で非公開ページにいる場合
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    return <Loading message="ログインページへ移動中..." />
  }

  return <>{children}</>
}
