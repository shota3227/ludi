'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/supabase'
import { useToast } from '@/components/common'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showToast('メールアドレスとパスワードを入力してください')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        console.error('Login error:', error)
        showToast('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
        return
      }
      
      if (data.user) {
        showToast('✅ ログインしました')
        // AuthProviderが自動的にリダイレクトする
      }
    } catch (err) {
      console.error('Login error:', err)
      showToast('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-primary-500 to-purple-500 text-white p-8 text-center">
        <div className="text-5xl mb-2">🎮</div>
        <h1 className="text-3xl font-bold mb-1">Ludi</h1>
        <p className="text-sm opacity-80">夢中になれる店舗をつくる</p>
      </div>

      {/* ログインフォーム */}
      <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="example@luvir.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="label">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ログイン中...
              </span>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ※ アカウントは管理者が作成します
        </p>
      </div>

      <ToastComponent />
    </div>
  )
}
