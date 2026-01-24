'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAttendanceStore, useNotificationStore } from '@/lib/store'
import { signOut } from '@/lib/supabase'
import { updateUserProfile } from '@/lib/database'
import { Header, BottomNav, Modal, useToast, getAvatarEmoji } from '@/components/common'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, logout: storeLogout } = useAuthStore()
  const { showToast, ToastComponent } = useToast()
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: user?.nickname || '',
    profile_text: user?.profile_text || '',
    strengths: user?.strengths || '',
    weaknesses: user?.weaknesses || '',
    hobbies: user?.hobbies || '',
    personality_type: user?.personality_type || '',
  })

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return
    
    await signOut()
    storeLogout()
    useAttendanceStore.getState().setAttendance(null)
    useNotificationStore.getState().setUnreadCount(0)
    router.push('/login')
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    
    try {
      const success = await updateUserProfile(user.id, editForm)
      if (success) {
        setUser({ ...user, ...editForm })
        showToast('✅ プロフィールを更新しました')
        setIsEditModalOpen(false)
      } else {
        showToast('更新に失敗しました')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      showToast('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const avatarOptions = [
    { id: 'warrior_01', emoji: '🧙' },
    { id: 'mage_01', emoji: '🧝' },
    { id: 'knight_01', emoji: '🛡️' },
    { id: 'healer_01', emoji: '💚' },
    { id: 'ninja_01', emoji: '🥷' },
    { id: 'fairy_01', emoji: '🧚' },
    { id: 'default_01', emoji: '😊' },
  ]

  const changeAvatar = async (avatarId: string) => {
    if (!user) return
    const success = await updateUserProfile(user.id, { avatar_id: avatarId })
    if (success) {
      setUser({ ...user, avatar_id: avatarId })
      showToast('✅ アバターを変更しました')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Header title="マイページ" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* プロフィールカード */}
        <div className="card p-6 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-3">
            {getAvatarEmoji(user.avatar_id)}
          </div>
          <h2 className="text-xl font-bold">{user.nickname || user.name}</h2>
          <div className="text-gray-500">Lv.{user.rank}</div>
          <div className="text-sm text-gray-400 mt-1">{user.email}</div>
          
          <button
            onClick={() => {
              setEditForm({
                nickname: user.nickname || '',
                profile_text: user.profile_text || '',
                strengths: user.strengths || '',
                weaknesses: user.weaknesses || '',
                hobbies: user.hobbies || '',
                personality_type: user.personality_type || '',
              })
              setIsEditModalOpen(true)
            }}
            className="mt-4 text-sm text-primary-600 hover:underline"
          >
            プロフィールを編集
          </button>
        </div>

        {/* アバター変更 */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 mb-3">アバターを変更</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => changeAvatar(avatar.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  user.avatar_id === avatar.id 
                    ? 'bg-primary-100 ring-2 ring-primary-500' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* プロフィール情報 */}
        {user.profile_text && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">自己紹介</h3>
            <p className="text-sm text-gray-600">{user.profile_text}</p>
          </div>
        )}

        {user.strengths && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">得意なこと</h3>
            <p className="text-sm text-gray-600">{user.strengths}</p>
          </div>
        )}

        {user.weaknesses && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">苦手なこと</h3>
            <p className="text-sm text-gray-600">{user.weaknesses}</p>
          </div>
        )}

        {user.hobbies && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">趣味</h3>
            <p className="text-sm text-gray-600">{user.hobbies}</p>
          </div>
        )}

        {/* メニュー */}
        <div className="space-y-2">
          <button onClick={() => router.push('/points/history')} className="w-full card p-4 text-left hover:bg-gray-50">
            📊 ポイント履歴
          </button>
          <button onClick={() => router.push('/attendance/history')} className="w-full card p-4 text-left hover:bg-gray-50">
            📅 勤怠履歴
          </button>
        </div>

        {/* ログアウト */}
        <button onClick={handleLogout} className="w-full py-3 text-red-500 hover:bg-red-50 rounded-lg">
          ログアウト
        </button>
      </main>

      {/* プロフィール編集モーダル */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="プロフィール編集">
        <div className="space-y-4">
          <div>
            <label className="label">ニックネーム</label>
            <input
              type="text"
              value={editForm.nickname}
              onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">自己紹介</label>
            <textarea
              value={editForm.profile_text}
              onChange={(e) => setEditForm({ ...editForm, profile_text: e.target.value })}
              className="input h-20 resize-none"
            />
          </div>
          <div>
            <label className="label">得意なこと</label>
            <input
              type="text"
              value={editForm.strengths}
              onChange={(e) => setEditForm({ ...editForm, strengths: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">苦手なこと</label>
            <input
              type="text"
              value={editForm.weaknesses}
              onChange={(e) => setEditForm({ ...editForm, weaknesses: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">趣味</label>
            <input
              type="text"
              value={editForm.hobbies}
              onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">性格タイプ（MBTI等）</label>
            <input
              type="text"
              value={editForm.personality_type}
              onChange={(e) => setEditForm({ ...editForm, personality_type: e.target.value })}
              className="input"
              placeholder="例: ENFP"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1">
              キャンセル
            </button>
            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary flex-1">
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      <BottomNav />
      <ToastComponent />
    </div>
  )
}
