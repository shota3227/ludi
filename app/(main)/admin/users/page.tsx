'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { getStoreMembers, getAllStores, createUser } from '@/lib/database'
import { adminCreateUserAction, adminGetAllUsersAction, adminGetStoreMembersAction, adminGetAllAuthUsersAction, adminDeleteGhostUsersAction } from '@/lib/user-actions'
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
        if (result.success && Array.isArray(result.users)) {
          setUsers(result.users)
        } else {
          setUsers([])
        }
        setNewUser(prev => ({ ...prev, primary_store_id: currentStore.id }))
      } else {
        const result = await adminGetAllUsersAction()
        if (result.success && Array.isArray(result.users)) {
          setUsers(result.users)
        } else {
          setUsers([])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setUsers([])
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

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [ghostUsers, setGhostUsers] = useState<User[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const handleCheckSync = async () => {
    setIsSyncing(true)
    try {
      // 1. Authユーザー全件取得
      const authResult = await adminGetAllAuthUsersAction()
      if (!authResult.success || !authResult.users) {
        showToast('Authユーザーの取得に失敗しました')
        return
      }

      const authUserIds = new Set(authResult.users.map((u: any) => u.id))

      // 2. DBユーザーにあってAuthにないもの（ゴースト）を特定
      const ghosts = users.filter(user => !authUserIds.has(user.id))
      setGhostUsers(ghosts)
      setIsSyncModalOpen(true)

      if (ghosts.length === 0) {
        showToast('✅ データの不整合は見つかりませんでした')
      }
    } catch (error) {
      console.error('Sync check error', error)
      showToast('同期チェック中にエラーが発生しました')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExecuteSync = async () => {
    if (!ghostUsers.length) return
    if (!confirm(`${ghostUsers.length}件の不明なユーザーデータを削除しますか？この操作は元に戻せません。`)) return

    setIsSyncing(true)
    try {
      const result = await adminDeleteGhostUsersAction(ghostUsers.map(u => u.id))
      if (result.success) {
        showToast('✅ データの整理が完了しました')
        setIsSyncModalOpen(false)
        loadData() // リスト更新
      } else {
        showToast(`削除に失敗しました: ${result.error}`)
      }
    } catch (error) {
      showToast('削除中にエラーが発生しました')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <Header title="ユーザー管理" showBack backHref="/" variant="manager" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* アクションボタン */}
        <div className="flex gap-2">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex-1">
            ＋ 新規ユーザーを追加
          </button>
          <button
            onClick={handleCheckSync}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow font-bold hover:bg-gray-700 whitespace-nowrap"
            disabled={isSyncing}
          >
            {isSyncing ? '確認中...' : '⚙️ データ整理'}
          </button>
        </div>

        {/* ユーザー一覧 */}
        <div className="space-y-2">
          {Array.isArray(users) && users.map((user) => {
            if (!user || !user.id) return null
            return (
              <div key={user.id} className={`card p-4 ${!user.is_active && 'opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {getAvatarEmoji(user.avatar_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {user.nickname || user.name || 'No Name'}
                      {user.role === 'manager' && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">店長</span>
                      )}
                      {user.role === 'system_admin' && (
                        <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">管理者</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email || 'No Email'}</div>
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
            )
          })}
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

      {/* データ同期モーダル */}
      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="データ整合性チェック">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            認証システム（Supabase Auth）とデータベース（Public Users）を照合しました。
          </div>

          {ghostUsers.length > 0 ? (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="font-bold text-orange-800 mb-2">⚠️ {ghostUsers.length}件の不明なデータが見つかりました</p>
              <p className="text-xs text-orange-700 mb-3">
                これらは認証システムに存在しない（ログインできない）古いデータやサンプルデータです。削除して整理することをお勧めします。
              </p>
              <div className="max-h-40 overflow-y-auto bg-white rounded border border-orange-100 p-2 text-xs text-gray-600 space-y-1">
                {ghostUsers.map((user: User) => (
                  <div key={user.id} className="flex justify-between">
                    <span>{user.name} ({user.email})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800 text-center">
              ✅ データの不整合はありません。<br />すべてのデータが正常です。
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setIsSyncModalOpen(false)} className="btn-secondary flex-1">
              閉じる
            </button>
            {ghostUsers.length > 0 && (
              <button onClick={handleExecuteSync} disabled={isSyncing} className="bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 active:bg-red-700 transition shadow-sm flex-1">
                {isSyncing ? '処理中...' : 'ゴミ箱に入れて整理する'}
              </button>
            )}
          </div>
        </div>
      </Modal>

      <ToastComponent />
    </div>
  )
}
