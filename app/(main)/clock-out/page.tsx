'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getPointHistory } from '@/lib/database'
import { Header } from '@/components/common'

export default function ClockOutPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [todayPoints, setTodayPoints] = useState({ thanks: 0, goodjob: 0 })

  useEffect(() => {
    if (user) {
      loadTodayPoints()
    }
  }, [user])

  const loadTodayPoints = async () => {
    if (!user) return
    
    const history = await getPointHistory(user.id, 'received')
    const today = new Date().toISOString().split('T')[0]
    
    const todayTransactions = history.filter(t => t.created_at.startsWith(today))
    
    const thanks = todayTransactions
      .filter(t => t.point_type === 'thanks')
      .reduce((sum, t) => sum + t.points, 0)
    
    const goodjob = todayTransactions
      .filter(t => t.point_type === 'goodjob')
      .reduce((sum, t) => sum + t.points, 0)
    
    setTodayPoints({ thanks, goodjob })
  }

  const totalPoints = todayPoints.thanks + todayPoints.goodjob

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="退勤打刻" showBack backHref="/" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 打刻完了 */}
        <div className="text-center py-4 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-3">
            <span className="text-4xl">🎉</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">お疲れさまでした！</div>
        </div>

        {/* 本日の獲得ポイント */}
        <div className="card p-4 bg-pink-50 border-pink-200">
          <h3 className="font-bold text-pink-700 mb-3 flex items-center gap-2">
            <span>💖</span> 本日の獲得ポイント
          </h3>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">+{todayPoints.thanks}</div>
              <div className="text-xs text-gray-500">サンクス</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">+{todayPoints.goodjob}</div>
              <div className="text-xs text-gray-500">Good Job</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-pink-200 text-center">
            <span className="text-sm text-gray-600">合計</span>
            <span className="ml-2 text-xl font-bold text-pink-600">+{totalPoints}pt</span>
          </div>
        </div>

        {/* OKボタン */}
        <button onClick={() => router.push('/')} className="btn-primary w-full">
          OK
        </button>
      </main>
    </div>
  )
}
