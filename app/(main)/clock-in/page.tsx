'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAttendanceStore } from '@/lib/store'
import { getTodayMissions } from '@/lib/database'
import { Header, formatTime } from '@/components/common'
import type { Mission } from '@/types'

export default function ClockInPage() {
  const router = useRouter()
  const store = useAuthStore((s) => s.store)
  const { currentAttendance } = useAttendanceStore()
  const [missions, setMissions] = useState<Mission[]>([])

  useEffect(() => {
    if (store) {
      loadMissions()
    }
  }, [store])

  const loadMissions = async () => {
    if (!store) return
    const data = await getTodayMissions(store.id)
    setMissions(data.filter(m => m.status === 'active'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="出勤打刻" showBack backHref="/" />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 打刻完了 */}
        <div className="text-center py-4 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-lg font-bold text-green-600">出勤しました！</div>
          <div className="text-3xl font-bold mt-1">
            {currentAttendance ? formatTime(currentAttendance.clock_in) : '--:--'}
          </div>
          <div className="text-sm text-gray-500 mt-1">{store?.name}</div>
        </div>

        {/* 今日のミッション */}
        {missions.length > 0 && (
          <div className="card p-4 bg-yellow-50 border-yellow-200">
            <h3 className="font-bold text-yellow-700 mb-3 flex items-center gap-2">
              <span>🎯</span> 今日のミッション
            </h3>
            <div className="space-y-3">
              {missions.slice(0, 3).map((mission) => (
                <div key={mission.id} className="bg-white rounded-lg p-3 flex items-center gap-3">
                  <span className="text-2xl">{mission.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{mission.name}</div>
                    <div className="text-xs text-gray-500">+{mission.points}pt</div>
                  </div>
                  {mission.target_value && (
                    <div className="text-xs bg-yellow-200 px-2 py-1 rounded font-medium">
                      {mission.current_value}/{mission.target_value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OKボタン */}
        <button onClick={() => router.push('/')} className="btn-primary w-full">
          OK
        </button>
      </main>
    </div>
  )
}
