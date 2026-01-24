'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { getNotifications, markNotificationAsRead } from '@/lib/database'
import { Header, Loading, timeAgo } from '@/components/common'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const { decrementUnread } = useNotificationStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getNotifications(user.id, 50)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return
    
    const success = await markNotificationAsRead(notification.id)
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      )
      decrementUnread()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'point_received': return '💖'
      case 'goodjob_received': return '⭐'
      case 'mission_completed': return '🎉'
      case 'skill_acquired': return '📚'
      case 'reward_earned': return '🏆'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'point_received': return 'border-pink-400'
      case 'goodjob_received': return 'border-yellow-400'
      case 'mission_completed': return 'border-green-400'
      case 'skill_acquired': return 'border-blue-400'
      case 'reward_earned': return 'border-purple-400'
      default: return 'border-gray-400'
    }
  }

  if (isLoading) {
    return <Loading message="通知読み込み中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      <Header title="通知" showBack backHref="/" />

      <main className="p-4 max-w-lg mx-auto space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            通知はありません
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleMarkAsRead(notification)}
              className={`w-full card p-4 text-left border-l-4 ${getNotificationColor(notification.type)} ${
                notification.is_read ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                    {notification.title}
                  </div>
                  <div className={`text-sm mt-1 ${notification.is_read ? 'text-gray-500' : 'text-gray-600'}`}>
                    {notification.body}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {timeAgo(notification.created_at)}
                  </div>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                )}
              </div>
            </button>
          ))
        )}
      </main>
    </div>
  )
}
