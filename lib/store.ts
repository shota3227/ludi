import { create } from 'zustand'
import type { User, AttendanceRecord, Store } from '@/types'

// 認証ストア
interface AuthStore {
  user: User | null
  store: Store | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setStore: (store: Store | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  store: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setStore: (store) => set({ store }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, store: null }),
}))

// 勤怠ストア
interface AttendanceStore {
  currentAttendance: AttendanceRecord | null
  isWorking: boolean
  setAttendance: (attendance: AttendanceRecord | null) => void
  clockIn: (attendance: AttendanceRecord) => void
  clockOut: () => void
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  currentAttendance: null,
  isWorking: false,
  setAttendance: (attendance) => set({ 
    currentAttendance: attendance, 
    isWorking: attendance !== null && attendance.clock_out === null 
  }),
  clockIn: (attendance) => set({ currentAttendance: attendance, isWorking: true }),
  clockOut: () => set((state) => ({ 
    currentAttendance: state.currentAttendance ? { ...state.currentAttendance, clock_out: new Date().toISOString() } : null,
    isWorking: false 
  })),
}))

// 通知ストア
interface NotificationStore {
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}))
