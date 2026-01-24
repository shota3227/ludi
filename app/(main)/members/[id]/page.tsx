'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getUserById, getPointSummary, getUserSkills } from '@/lib/database'
import { Header, Loading, getAvatarEmoji } from '@/components/common'
import type { User, PointSummary, SkillAcquisition } from '@/types'

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string
  
  const [member, setMember] = useState<User | null>(null)
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null)
  const [skills, setSkills] = useState<SkillAcquisition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMember()
  }, [memberId])

  const loadMember = async () => {
    setIsLoading(true)
    try {
      const [memberData, points, userSkills] = await Promise.all([
        getUserById(memberId),
        getPointSummary(memberId),
        getUserSkills(memberId),
      ])
      
      setMember(memberData)
      setPointSummary(points)
      setSkills(userSkills)
    } catch (error) {
      console.error('Error loading member:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loading message="読み込み中..." />
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="プロフィール" showBack backHref="/members" />
        <div className="p-4 text-center text-gray-500">
          メンバーが見つかりません
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <Header title="プロフィール" showBack backHref="/members" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* プロフィールカード */}
        <div className="text-center py-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-3">
            {getAvatarEmoji(member.avatar_id)}
          </div>
          <h2 className="text-xl font-bold">{member.nickname || member.name}</h2>
          <div className="text-gray-500">Lv.{member.rank}</div>
          {member.role === 'manager' && (
            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">店長</span>
          )}
        </div>

        {/* ポイントサマリー */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-pink-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-pink-600">{pointSummary?.thanks_received || 0}</div>
            <div className="text-xs text-gray-500">サンクス</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pointSummary?.goodjob_received || 0}</div>
            <div className="text-xs text-gray-500">Good Job</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
            <div className="text-xs text-gray-500">スキル</div>
          </div>
        </div>

        {/* 自己紹介 */}
        {member.profile_text && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">自己紹介</h3>
            <p className="text-sm text-gray-600">{member.profile_text}</p>
          </div>
        )}

        {/* 得意なこと */}
        {member.strengths && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">得意なこと</h3>
            <p className="text-sm text-gray-600">{member.strengths}</p>
          </div>
        )}

        {/* 苦手なこと */}
        {member.weaknesses && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">苦手なこと</h3>
            <p className="text-sm text-gray-600">{member.weaknesses}</p>
          </div>
        )}

        {/* 趣味 */}
        {member.hobbies && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">趣味</h3>
            <p className="text-sm text-gray-600">{member.hobbies}</p>
          </div>
        )}

        {/* 性格タイプ */}
        {member.personality_type && (
          <div className="card p-4">
            <h3 className="font-bold text-gray-700 mb-2">性格タイプ</h3>
            <p className="text-sm text-gray-600">{member.personality_type}</p>
          </div>
        )}

        {/* ポイントを送るボタン */}
        <Link 
          href={`/points/send?to=${member.id}`}
          className="btn-primary w-full block text-center"
        >
          💖 ポイントを送る
        </Link>
      </main>
    </div>
  )
}
