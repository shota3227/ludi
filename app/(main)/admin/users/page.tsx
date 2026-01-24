'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { getStoreMembers, getAllStores, createUser } from '@/lib/database'
import { adminCreateUserAction, adminGetAllUsersAction, adminGetStoreMembersAction } from '@/lib/user-actions'
import { Header, Modal, Loading, useToast, getAvatarEmoji } from '@/components/common'
import type { User, Store } from '@/types'

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const currentStore = useAuthStore((s) => s.store)

  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    nickname: '',
    role: 'staff' as User['role'],
    primary_store_id: '',
  })

  const { showToast, ToastComponent } = useToast()

  // 管理者権限チェック
  const isAdmin = currentUser?.role === 'manager' || currentUser?.role === 'headquarters_admin' || currentUser?.role === 'system_admin'

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 店舗一覧
      const allStores = await getAllStores()
      setStores(allStores)

      // ユーザー一覧（管理者権限で取得して RLS を回避）
      if (currentUser?.role === 'manager' && currentStore) {
        const result = await adminGetStoreMembersAction(currentStore.id)
        if (result.success) {
          setUsers(result.users || [])
        }
        setNewUser(prev => ({ ...prev, primary_store_id: currentStore.id }))
      } else {
        const result = await adminGetAllUsersAction()
        if (result.success) {
          setUsers(result.users || [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name || !newUser.primary_store_id) {
      showToast('必須項目を入力してください')
      return
    }

    setIsSaving(true)
    try {
      // サーバーサイドでのユーザー作成（Server Action）を実行
      const result = await adminCreateUserAction({
        email: newUser.email.trim(),
        password: newUser.password,
        name: newUser.name,
        nickname: newUser.nickname,
        role: newUser.role,
        primary_store_id: newUser.primary_store_id,
      })

      if (result.success) {
        showToast('✅ ユーザーを作成しました')
        setIsModalOpen(false)
        setNewUser({
          email: '',
          password: '',
          name: '',
          nickname: '',
          role: 'staff',
          primary_store_id: currentStore?.id || '',
        })
        loadData()
      } else {
        console.error('Action error:', result.error)
        showToast(`❌ 作成に失敗しました: ${result.error}`)
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      showToast('予期せぬエラーが発生しました。環境変数が正しく設定されているか確認してください。')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (!error) {
        showToast(currentStatus ? 'ユーザーを無効化しました' : 'ユーザーを有効化しました')
        loadData()
      }
    } catch (error) {
      console.error('Error toggling user:', error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ユーザー管理" showBack backHref="/" variant="manager" />
        <div className="p-4 text-center text-gray-500">
          この機能は管理者のみ利用できます
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <Loading message="読み込み中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <Header title="ユーザー管理" showBack backHref="/" variant="manager" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 新規作成ボタン */}
        <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full">
          ＋ 新規ユーザーを追加
        </button>

        {/* ユーザー一覧 */}
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className={`card p-4 ${!user.is_active && 'opacity-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                  {getAvatarEmoji(user.avatar_id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {user.nickname || user.name}
                    {user.role === 'manager' && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">店長</span>
                    )}
                    {user.role === 'system_admin' && (
                      <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">管理者</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
                <button
                  onClick={() => toggleUserActive(user.id, user.is_active)}
                  className={`text-xs px-2 py-1 rounded ${user.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {user.is_active ? '有効' : '無効'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 新規ユーザー作成モーダル */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新規ユーザー作成">
        <div className="space-y-4">
          <div>
            <label className="label">メールアドレス *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="input"
              placeholder="example@luvir.com"
            />
          </div>
          <div>
            <label className="label">パスワード *</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="input"
              placeholder="8文字以上"
            />
          </div>
          <div>
            <label className="label">氏名 *</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="input"
              placeholder="山田太郎"
            />
          </div>
          <div>
            <label className="label">ニックネーム</label>
            <input
              type="text"
              value={newUser.nickname}
              onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })}
              className="input"
              placeholder="タロー"
            />
          </div>
          <div>
            <label className="label">役割</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
              className="input"
            >
              <option value="staff">スタッフ</option>
              <option value="manager">店長</option>
              {currentUser?.role === 'system_admin' && (
                <option value="headquarters_admin">本部管理者</option>
              )}
            </select>
          </div>
          <div>
            <label className="label">所属店舗 *</label>
            <select
              value={newUser.primary_store_id}
              onChange={(e) => setNewUser({ ...newUser, primary_store_id: e.target.value })}
              className="input"
            >
              <option value="">選択してください</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">
              キャンセル
            </button>
            <button onClick={handleCreateUser} disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? '作成中...' : '作成'}
            </button>
          </div>
        </div>
      </Modal>

      <ToastComponent />
    </div>
  )
}
