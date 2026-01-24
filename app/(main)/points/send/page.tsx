'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getStoreMembers, getUserById, getGoodJobCategories, getTodayRemainingPoints, sendPoints } from '@/lib/database'
import { Header, Loading, useToast, getAvatarEmoji } from '@/components/common'
import type { User, GoodJobCategory } from '@/types'

export default function SendPointsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialToId = searchParams.get('to')
  
  const currentUser = useAuthStore((s) => s.user)
  const store = useAuthStore((s) => s.store)
  
  const [step, setStep] = useState<'select' | 'send'>(initialToId ? 'send' : 'select')
  const [members, setMembers] = useState<User[]>([])
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [categories, setCategories] = useState<GoodJobCategory[]>([])
  const [remainingPoints, setRemainingPoints] = useState(50)
  
  const [pointType, setPointType] = useState<'thanks' | 'goodjob'>('thanks')
  const [points, setPoints] = useState(10)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [freeText, setFreeText] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (store) {
        const storeMembers = await getStoreMembers(store.id)
        setMembers(storeMembers.filter(m => m.id !== currentUser?.id))
        
        const cats = await getGoodJobCategories(store.organization_id)
        setCategories(cats)
      }
      
      if (currentUser) {
        const remaining = await getTodayRemainingPoints(currentUser.id)
        setRemainingPoints(remaining)
      }
      
      if (initialToId) {
        const member = await getUserById(initialToId)
        if (member) {
          setSelectedMember(member)
          setStep('send')
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMember = (member: User) => {
    setSelectedMember(member)
    setStep('send')
  }

  const handleSend = async () => {
    if (!currentUser || !selectedMember) return
    if (points > remainingPoints) {
      showToast('送付可能ポイントを超えています')
      return
    }
    
    setIsSending(true)
    try {
      const success = await sendPoints(
        currentUser.id,
        selectedMember.id,
        pointType,
        points,
        message || undefined,
        selectedCategory || undefined,
        freeText || undefined
      )
      
      if (success) {
        showToast(`✅ ${selectedMember.nickname || selectedMember.name}さんに${points}pt送りました！`)
        setTimeout(() => router.push('/'), 1500)
      } else {
        showToast('送付に失敗しました')
      }
    } catch (error) {
      console.error('Error sending points:', error)
      showToast('エラーが発生しました')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <Loading message="読み込み中..." />
  }

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="ポイントを送る" showBack backHref="/" />
        <main className="p-4 max-w-lg mx-auto">
          <p className="text-sm text-gray-600 mb-4">送りたい相手を選んでください</p>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">送れるメンバーがいません</div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <button key={member.id} onClick={() => handleSelectMember(member)}
                  className="w-full card p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                    {getAvatarEmoji(member.avatar_id)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{member.nickname || member.name}</div>
                    <div className="text-xs text-gray-500">Lv.{member.rank}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
        <ToastComponent />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="ポイントを送る" showBack backHref="/" />
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            {getAvatarEmoji(selectedMember?.avatar_id || 'default_01')}
          </div>
          <div>
            <div className="font-bold">{selectedMember?.nickname || selectedMember?.name}</div>
            <div className="text-xs text-gray-500">Lv.{selectedMember?.rank}</div>
          </div>
          <button onClick={() => setStep('select')} className="ml-auto text-sm text-primary-600">変更</button>
        </div>

        <div>
          <label className="label">ポイント種別</label>
          <div className="flex gap-2">
            <button onClick={() => setPointType('thanks')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${pointType === 'thanks' ? 'bg-pink-50 border-pink-400' : 'bg-white border-gray-200'}`}>
              <div className="text-2xl mb-1">💖</div>
              <div className={`text-sm font-medium ${pointType === 'thanks' ? 'text-pink-700' : 'text-gray-500'}`}>サンクス</div>
            </button>
            <button onClick={() => setPointType('goodjob')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${pointType === 'goodjob' ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
              <div className="text-2xl mb-1">⭐</div>
              <div className={`text-sm font-medium ${pointType === 'goodjob' ? 'text-yellow-700' : 'text-gray-500'}`}>Good Job</div>
            </button>
          </div>
        </div>

        {pointType === 'goodjob' && categories.length > 0 && (
          <div>
            <label className="label">カテゴリ（任意）</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${selectedCategory === cat.id ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
                  <span className="mr-2">{cat.icon}</span><span className="text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
            {!selectedCategory && (
              <input type="text" value={freeText} onChange={(e) => setFreeText(e.target.value)}
                className="input mt-2" placeholder="その他（自由入力）" />
            )}
          </div>
        )}

        <div>
          <label className="label">ポイント数</label>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => setPoints(Math.max(1, points - 5))}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 text-xl font-bold">−</button>
            <div className="text-5xl font-bold text-primary-600 w-24 text-center">{points}</div>
            <button onClick={() => setPoints(Math.min(remainingPoints, points + 5))}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 text-xl font-bold">+</button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">残り送付可能: {remainingPoints}pt</div>
        </div>

        <div>
          <label className="label">メッセージ（任意）</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className="input h-24 resize-none" placeholder="ありがとう！助かりました！" />
        </div>

        <button onClick={handleSend} disabled={isSending || points > remainingPoints}
          className={`w-full py-4 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${pointType === 'thanks' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
          {isSending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>送信中...
            </span>
          ) : (
            <>{pointType === 'thanks' ? '💖' : '⭐'} {points}pt を送る</>
          )}
        </button>
      </main>
      <ToastComponent />
    </div>
  )
}
