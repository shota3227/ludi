'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore, useNotificationStore } from '@/lib/store'

// ================================
// ヘッダー
// ================================
interface HeaderProps {
  title?: string
  showBack?: boolean
  backHref?: string
  badge?: string
  rightContent?: ReactNode
  variant?: 'primary' | 'manager' | 'admin'
}

export function Header({ title, showBack, backHref = '/', badge, rightContent, variant = 'primary' }: HeaderProps) {
  const router = useRouter()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  
  const bgClass = {
    primary: 'bg-gradient-to-r from-primary-500 to-purple-500',
    manager: 'bg-gradient-to-r from-green-500 to-emerald-600',
    admin: 'bg-gradient-to-r from-orange-500 to-red-500',
  }[variant]

  return (
    <header className={`${bgClass} text-white p-4 sticky top-0 z-40`}>
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => backHref ? router.push(backHref) : router.back()} className="-ml-1 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {title && <h1 className="font-bold text-lg">{title}</h1>}
          {badge && <span className="text-sm bg-white/20 px-2 py-0.5 rounded ml-2">{badge}</span>}
        </div>
        <div className="flex items-center gap-2">
          {rightContent}
          <Link href="/notifications" className="relative p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

// ================================
// ユーザーヘッダー（ホーム用）
// ================================
export function UserHeader() {
  const user = useAuthStore((s) => s.user)
  const store = useAuthStore((s) => s.store)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  
  const avatarEmoji = getAvatarEmoji(user?.avatar_id || 'default_01')

  return (
    <header className="bg-gradient-to-r from-primary-500 to-purple-500 text-white p-4">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            {avatarEmoji}
          </div>
          <div>
            <div className="font-bold">
              {user?.nickname || user?.name || 'ゲスト'} 
              <span className="font-normal text-sm opacity-80 ml-1">Lv.{user?.rank || 1}</span>
            </div>
            {store && <div className="text-xs opacity-80">{store.name}</div>}
          </div>
        </div>
        <Link href="/notifications" className="relative p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}

// ================================
// ボトムナビゲーション
// ================================
export function BottomNav() {
  const pathname = usePathname()
  
  const items = [
    { href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'ホーム' },
    { href: '/ranking', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'ランキング' },
    { href: '/skills', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: '学習' },
    { href: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'マイページ' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ================================
// ローディング
// ================================
export function Loading({ message = '読み込み中...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// ================================
// モーダル
// ================================
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ================================
// トースト
// ================================
interface ToastProps {
  message: string
  isVisible: boolean
}

export function Toast({ message, isVisible }: ToastProps) {
  if (!isVisible) return null
  return <div className="toast animate-fadeIn">{message}</div>
}

// カスタムフックとしても提供
export function useToast() {
  const [toast, setToast] = useState({ message: '', isVisible: false })
  
  const showToast = (message: string, duration = 2500) => {
    setToast({ message, isVisible: true })
    setTimeout(() => setToast({ message: '', isVisible: false }), duration)
  }
  
  return { toast, showToast, ToastComponent: () => <Toast {...toast} /> }
}

// ================================
// ヘルパー関数
// ================================
export function getAvatarEmoji(avatarId: string): string {
  const map: Record<string, string> = {
    'warrior_01': '🧙', 'warrior_02': '⚔️', 'mage_01': '🧝', 'knight_01': '🛡️',
    'healer_01': '💚', 'ninja_01': '🥷', 'fairy_01': '🧚', 'manager_01': '👨‍💼',
    'manager_02': '👨‍💼', 'manager_03': '👩‍💼', 'admin_01': '👑', 'default_01': '😊',
  }
  return map[avatarId] || '😊'
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'たった今'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間前`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}日前`
  return formatDate(dateString)
}
