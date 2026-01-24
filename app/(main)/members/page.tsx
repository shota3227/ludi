'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { getStoreMembers, getWorkingMembers, getPointSummary, getUserSkills } from '@/lib/database'
import { Header, BottomNav, Loading, getAvatarEmoji, formatTime } from '@/components/common'
import type { User, PointSummary } from '@/types'

interface MemberWithStats extends User {
  pointSummary?: PointSummary
  skillCount?: number
  isWorking?: boolean
  clockInTime?: string
}

export default function MembersPage() {
  const store = useAuthStore((s) => s.store)
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (store) {
      loadMembers()
    }
  }, [store])

  const loadMembers = async () => {
    if (!store) return
    setIsLoading(true)

    try {
      // メンバー一覧を取得
      const storeMembers = await getStoreMembers(store.id)
      
      // 勤務中メンバーを取得
      const workingMembers = await getWorkingMembers(store.id)
      const workingMap = new Map(workingMembers.map(m => [m.id, m.clock_in]))
      
      // 各メンバーの追加情報を取得
      const membersWithStats = await Promise.all(
        storeMembers.map(async (member) => {
          const [pointSummary, skills] = await Promise.all([
            getPointSummary(member.id),
            getUserSkills(member.id),
          ])
          return {
            ...member,
            pointSummary,
            skillCount: skills.length,
            isWorking: workingMap.has(member.id),
            clockInTime: workingMap.get(member.id),
          }
        })
      )
      
      // 勤務中を上に、その後ランク順でソート
      membersWithStats.sort((a, b) => {
        if (a.isWorking && !b.isWorking) return -1
        if (!a.isWorking && b.isWorking) return 1
        return b.rank - a.rank
      })
      
      setMembers(membersWithStats)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loading message="メンバー読み込み中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Header title="メンバー" showBack backHref="/" badge={store?.name} />

      <main className="p-4 max-w-lg mx-auto space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            メンバーがいません
          </div>
        ) : (
          members.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow block"
            >
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                {getAvatarEmoji(member.avatar_id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">
                  {member.nickname || member.name}
                  <span className="text-xs font-normal text-gray-500 ml-1">Lv.{member.rank}</span>
                  {member.role === 'manager' && (
                    <span className="text-xs font-normal bg-blue-100 text-blue-700 px-1 rounded ml-1">店長</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  スキル: {member.skillCount || 0}個 / サンクス: {member.pointSummary?.thanks_received || 0}pt
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${
                member.isWorking 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {member.isWorking ? `${formatTime(member.clockInTime!)}〜` : '勤務外'}
              </div>
            </Link>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  )
}
