'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Header, BottomNav, Loading, getAvatarEmoji } from '@/components/common'

interface RankingUser {
  id: string
  nickname: string
  avatar_id: string
  value: number
}

export default function RankingPage() {
  const currentUser = useAuthStore((s) => s.user)
  const store = useAuthStore((s) => s.store)
  
  const [rankingType, setRankingType] = useState<'thanks' | 'goodjob'>('thanks')
  const [rankings, setRankings] = useState<RankingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    loadRankings()
  }, [rankingType, store])

  const loadRankings = async () => {
    if (!store) return
    setIsLoading(true)
    
    try {
      // 店舗のメンバーのポイントサマリーを取得
      const { data: members } = await supabase
        .from('users')
        .select('id, nickname, avatar_id')
        .eq('primary_store_id', store.id)
        .eq('is_active', true)
      
      if (!members) {
        setRankings([])
        return
      }
      
      // 各メンバーのポイントを取得
      const rankingData: RankingUser[] = await Promise.all(
        members.map(async (member) => {
          const { data: summary } = await supabase
            .from('user_point_summary')
            .select('*')
            .eq('user_id', member.id)
            .single()
          
          return {
            id: member.id,
            nickname: member.nickname || '名無し',
            avatar_id: member.avatar_id,
            value: rankingType === 'thanks' 
              ? (summary?.thanks_received || 0)
              : (summary?.goodjob_received || 0),
          }
        })
      )
      
      // ソート
      rankingData.sort((a, b) => b.value - a.value)
      setRankings(rankingData)
      
      // 自分の順位を取得
      const myIndex = rankingData.findIndex(r => r.id === currentUser?.id)
      setMyRank(myIndex >= 0 ? myIndex + 1 : null)
    } catch (error) {
      console.error('Error loading rankings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Header title="ランキング" badge={store?.name} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 種別切り替え */}
        <div className="flex gap-2">
          <button
            onClick={() => setRankingType('thanks')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              rankingType === 'thanks' 
                ? 'bg-pink-500 text-white' 
                : 'bg-white border border-gray-200'
            }`}
          >
            💖 サンクス
          </button>
          <button
            onClick={() => setRankingType('goodjob')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              rankingType === 'goodjob' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-white border border-gray-200'
            }`}
          >
            ⭐ Good Job
          </button>
        </div>

        {/* 自分の順位 */}
        {myRank && (
          <div className={`card p-4 ${rankingType === 'thanks' ? 'bg-pink-50 border-pink-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="text-center">
              <div className="text-sm text-gray-500">あなたの順位</div>
              <div className="text-3xl font-bold mt-1">
                {myRank <= 3 ? getRankDisplay(myRank) : `${myRank}位`}
              </div>
            </div>
          </div>
        )}

        {/* ランキング一覧 */}
        {isLoading ? (
          <Loading message="読み込み中..." />
        ) : rankings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            データがありません
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((user, index) => {
              const rank = index + 1
              const isMe = user.id === currentUser?.id
              
              return (
                <div 
                  key={user.id} 
                  className={`card p-4 flex items-center gap-3 ${isMe ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <div className={`w-8 text-center font-bold ${rank <= 3 ? 'text-2xl' : 'text-gray-500'}`}>
                    {getRankDisplay(rank)}
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {getAvatarEmoji(user.avatar_id)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.nickname}
                      {isMe && <span className="ml-1 text-xs text-primary-600">(あなた)</span>}
                    </div>
                  </div>
                  <div className={`font-bold ${rankingType === 'thanks' ? 'text-pink-600' : 'text-yellow-600'}`}>
                    {user.value}pt
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
