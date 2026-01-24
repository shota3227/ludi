'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { getTodayMissions, updateMissionProgress } from '@/lib/database'
import { Header, BottomNav, Loading, useToast } from '@/components/common'
import type { Mission } from '@/types'

export default function MissionsPage() {
  const store = useAuthStore((s) => s.store)
  const [missions, setMissions] = useState<Mission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    if (store) {
      loadMissions()
    }
  }, [store])

  const loadMissions = async () => {
    if (!store) return
    setIsLoading(true)
    try {
      const data = await getTodayMissions(store.id)
      setMissions(data)
    } catch (error) {
      console.error('Error loading missions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProgress = async (mission: Mission, newValue: number) => {
    if (mission.status === 'completed') return
    
    const success = await updateMissionProgress(mission.id, newValue)
    if (success) {
      loadMissions()
      if (mission.target_value && newValue >= mission.target_value) {
        showToast(`🎉 ミッション達成！ +${mission.points}pt`)
      }
    }
  }

  if (isLoading) {
    return <Loading message="ミッション読み込み中..." />
  }

  const activeMissions = missions.filter(m => m.status === 'active')
  const completedMissions = missions.filter(m => m.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Header title="今日のミッション" showBack backHref="/" badge={store?.name} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {missions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p>今日のミッションはまだありません</p>
          </div>
        ) : (
          <>
            {/* 進行中 */}
            {activeMissions.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-700 mb-2">進行中</h2>
                <div className="space-y-3">
                  {activeMissions.map((mission) => (
                    <div key={mission.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{mission.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold">{mission.name}</div>
                          {mission.description && (
                            <div className="text-sm text-gray-500">{mission.description}</div>
                          )}
                          <div className="text-sm text-primary-600 mt-1">+{mission.points}pt</div>
                        </div>
                      </div>
                      
                      {mission.target_value && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">進捗</span>
                            <span className="font-medium">{mission.current_value} / {mission.target_value}</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (mission.current_value / mission.target_value) * 100)}%` }}
                            />
                          </div>
                          
                          {/* 進捗更新ボタン */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleUpdateProgress(mission, mission.current_value + 1)}
                              className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => handleUpdateProgress(mission, mission.current_value + 5)}
                              className="flex-1 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleUpdateProgress(mission, mission.target_value as number)}
                              className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                            >
                              達成！
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 達成済み */}
            {completedMissions.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-700 mb-2">達成済み 🎉</h2>
                <div className="space-y-2">
                  {completedMissions.map((mission) => (
                    <div key={mission.id} className="card p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mission.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-green-700">{mission.name}</div>
                        </div>
                        <div className="text-green-600 font-bold">+{mission.points}pt</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
      <ToastComponent />
    </div>
  )
}
