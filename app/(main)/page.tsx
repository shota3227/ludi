'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore, useAttendanceStore } from '@/lib/store'
import { getPointSummary, getTodayMissions, clockIn as dbClockIn, clockOut as dbClockOut } from '@/lib/database'
import { UserHeader, BottomNav, useToast, formatTime } from '@/components/common'
import type { Mission, PointSummary } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const store = useAuthStore((s) => s.store)
  const { isWorking, currentAttendance, clockIn, clockOut } = useAttendanceStore()
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [isClocking, setIsClocking] = useState(false)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    // ポイントサマリーを取得
    const summary = await getPointSummary(user.id)
    setPointSummary(summary)
    
    // 本日のミッションを取得
    if (store) {
      const todayMissions = await getTodayMissions(store.id)
      setMissions(todayMissions)
    }
  }

  const handleClock = async () => {
    if (!user || !store) return
    setIsClocking(true)

    try {
      if (isWorking && currentAttendance) {
        // 退勤
        const result = await dbClockOut(currentAttendance.id)
        if (result) {
          clockOut()
          showToast('🔴 退勤しました')
          router.push('/clock-out')
        } else {
          showToast('退勤処理に失敗しました')
        }
      } else {
        // 出勤
        const result = await dbClockIn(user.id, store.id)
        if (result) {
          clockIn(result)
          showToast('🟢 出勤しました')
          router.push('/clock-in')
        } else {
          showToast('出勤処理に失敗しました')
        }
      }
    } catch (error) {
      console.error('Clock error:', error)
      showToast('エラーが発生しました')
    } finally {
      setIsClocking(false)
    }
  }

  const menuItems = [
    { href: '/members', icon: '👥', label: 'メンバー', color: 'border-blue-200 bg-blue-50' },
    { href: '/points/send', icon: '💝', label: 'ポイント送付', color: 'border-pink-200 bg-pink-50' },
    { href: '/skills', icon: '🗺️', label: 'スキルマップ', color: 'border-green-200 bg-green-50' },
    { href: '/missions', icon: '🎯', label: 'ミッション', color: 'border-yellow-200 bg-yellow-50' },
  ]

  // 管理者メニュー
  const isManager = user?.role === 'manager' || user?.role === 'headquarters_admin' || user?.role === 'system_admin'

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <UserHeader />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* 打刻ボタン */}
        <button
          onClick={handleClock}
          disabled={isClocking || !store}
          className={`w-full rounded-xl p-6 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
            isWorking 
              ? 'bg-gradient-to-r from-orange-400 to-red-500' 
              : 'bg-gradient-to-r from-green-400 to-emerald-500'
          }`}
        >
          {isClocking ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-xl font-bold">処理中...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3">
                {isWorking ? (
                  <>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
                    <span className="text-xl font-bold">退勤する</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <span className="text-xl font-bold">出勤する</span>
                  </>
                )}
              </div>
              {isWorking && currentAttendance && (
                <div className="text-sm mt-2 opacity-80">
                  勤務中 - {formatTime(currentAttendance.clock_in)}から
                </div>
              )}
            </>
          )}
        </button>

        {!store && (
          <p className="text-center text-sm text-red-500">
            ※ 店舗が設定されていません。管理者に連絡してください。
          </p>
        )}

        {/* ステータスカード */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <div className="text-2xl mb-1">💖</div>
            <div className="text-xs text-gray-500">サンクス</div>
            <div className="font-bold text-pink-600">{pointSummary?.thanks_received || 0}pt</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-xs text-gray-500">Good Job</div>
            <div className="font-bold text-yellow-600">{pointSummary?.goodjob_received || 0}pt</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xs text-gray-500">ランク</div>
            <div className="font-bold text-blue-600">Lv.{user?.rank || 1}</div>
          </div>
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`card p-4 text-center border ${item.color} hover:shadow-md transition-shadow`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
            </Link>
          ))}
        </div>

        {/* 管理者メニュー */}
        {isManager && (
          <div className="card p-4 border-green-200 bg-green-50">
            <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
              <span>👨‍💼</span> 管理メニュー
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/users" className="btn-ghost text-sm border border-green-300 text-center">
                👥 ユーザー管理
              </Link>
              <Link href="/admin/missions" className="btn-ghost text-sm border border-green-300 text-center">
                🎯 ミッション管理
              </Link>
            </div>
          </div>
        )}

        {/* 今日のミッション */}
        {missions.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-700">🎯 今日のミッション</h2>
              <Link href="/missions" className="text-sm text-primary-600">すべて見る</Link>
            </div>
            <div className="space-y-2">
              {missions.slice(0, 3).map((mission) => (
                <div key={mission.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <span className="text-xl">{mission.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{mission.name}</div>
                    <div className="text-xs text-gray-500">+{mission.points}pt</div>
                  </div>
                  {mission.target_value && (
                    <div className={`text-xs px-2 py-1 rounded font-medium ${
                      mission.status === 'completed' ? 'bg-green-200 text-green-700' : 'bg-yellow-200 text-yellow-700'
                    }`}>
                      {mission.current_value}/{mission.target_value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
      <ToastComponent />
    </div>
  )
}
