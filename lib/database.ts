import { supabase } from './supabase'
import type { User, PointTransaction, AttendanceRecord, Mission, Skill, SkillAcquisition, GoodJobCategory, Notification, PointSummary, Store } from '@/types'

// ================================
// ユーザー関連
// ================================

export async function getUserByAuthId(authId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return data
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function getStoreMembers(storeId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('primary_store_id', storeId)
    .eq('is_active', true)
    .order('rank', { ascending: false })

  if (error) return []
  return data || []
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  return !error
}

export async function createUser(userData: {
  email: string
  name: string
  nickname: string
  role: User['role']
  primary_store_id: string
  auth_id?: string
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...userData,
      avatar_id: 'default_01',
      rank: 1,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }
  return data
}

// ================================
// 店舗関連
// ================================

export async function getStore(storeId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()

  if (error) return null
  return data
}

export async function getAllStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) return []
  return data || []
}

// ================================
// ポイント関連
// ================================

export async function sendPoints(
  fromUserId: string,
  toUserId: string,
  pointType: 'thanks' | 'goodjob',
  points: number,
  message?: string,
  goodjobCategoryId?: string,
  goodjobFreeText?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('point_transactions')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      point_type: pointType,
      points,
      message,
      goodjob_category_id: goodjobCategoryId,
      goodjob_free_text: goodjobFreeText,
    })

  if (error) {
    console.error('Error sending points:', error)
    return false
  }

  // 通知を作成
  await createNotification(toUserId, 'point_received',
    pointType === 'thanks' ? '💖 サンクスポイントを受け取りました' : '⭐ Good Jobを受け取りました',
    `${points}ポイント受け取りました`,
    { from_user_id: fromUserId, points, point_type: pointType }
  )

  return true
}

export async function getPointHistory(userId: string, type?: 'sent' | 'received'): Promise<PointTransaction[]> {
  let query = supabase
    .from('point_transactions')
    .select(`
      *,
      from_user:users!point_transactions_from_user_id_fkey(id, nickname, avatar_id),
      to_user:users!point_transactions_to_user_id_fkey(id, nickname, avatar_id),
      goodjob_category:goodjob_categories(id, name, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (type === 'sent') {
    query = query.eq('from_user_id', userId)
  } else if (type === 'received') {
    query = query.eq('to_user_id', userId)
  } else {
    query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
  }

  const { data, error } = await query
  if (error || !data) return []

  return (data as any[]).map(item => ({
    ...item,
    from_user: Array.isArray(item.from_user) ? item.from_user[0] : item.from_user,
    to_user: Array.isArray(item.to_user) ? item.to_user[0] : item.to_user,
    goodjob_category: Array.isArray(item.goodjob_category) ? item.goodjob_category[0] : item.goodjob_category
  }))
}

export async function getPointSummary(userId: string): Promise<PointSummary> {
  const { data, error } = await supabase
    .from('user_point_summary')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return { thanks_sent: 0, thanks_received: 0, goodjob_sent: 0, goodjob_received: 0 }
  }
  return data
}

export async function getTodayRemainingPoints(userId: string, dailyLimit: number = 50): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('point_transactions')
    .select('points')
    .eq('from_user_id', userId)
    .gte('created_at', today)

  if (error || !data) return dailyLimit

  const sentToday = data.reduce((sum: number, t: { points: number }) => sum + t.points, 0)
  return Math.max(0, dailyLimit - sentToday)
}

// ================================
// Good Jobカテゴリ
// ================================

export async function getGoodJobCategories(organizationId: string): Promise<GoodJobCategory[]> {
  const { data, error } = await supabase
    .from('goodjob_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order')

  if (error) return []
  return data || []
}

// ================================
// 勤怠関連
// ================================

export async function clockIn(userId: string, storeId: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      user_id: userId,
      store_id: storeId,
      clock_in: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error clocking in:', error)
    return null
  }
  return data
}

export async function clockOut(attendanceId: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', attendanceId)
    .select()
    .single()

  if (error) {
    console.error('Error clocking out:', error)
    return null
  }
  return data
}

export async function getCurrentAttendance(userId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, store:stores(*)')
    .eq('user_id', userId)
    .gte('clock_in', today)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    ...data,
    store: Array.isArray((data as any).store) ? (data as any).store[0] : (data as any).store
  } as AttendanceRecord
}

export async function getAttendanceHistory(userId: string, limit: number = 30): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, store:stores(*)')
    .eq('user_id', userId)
    .order('clock_in', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as any[]).map(item => ({
    ...item,
    store: Array.isArray(item.store) ? item.store[0] : item.store
  }))
}

export async function getWorkingMembers(storeId: string): Promise<(User & { clock_in: string })[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      clock_in,
      user:users(*)
    `)
    .eq('store_id', storeId)
    .gte('clock_in', today)
    .is('clock_out', null)

  if (error || !data) return []

  return data.map((d: any) => {
    const userData = Array.isArray(d.user) ? d.user[0] : d.user
    return {
      ...(userData as User),
      clock_in: d.clock_in
    }
  })
}

// ================================
// ミッション関連
// ================================

export async function getTodayMissions(storeId: string): Promise<Mission[]> {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('store_id', storeId)
    .eq('target_date', today)
    .order('created_at')

  if (error) return []
  return data || []
}

export async function createMission(mission: {
  store_id: string
  name: string
  description?: string
  icon: string
  target_value?: number
  target_date: string
  points: number
  created_by: string
}): Promise<Mission | null> {
  const { data, error } = await supabase
    .from('missions')
    .insert({
      ...mission,
      current_value: 0,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating mission:', error)
    return null
  }
  return data
}

export async function updateMissionProgress(missionId: string, currentValue: number): Promise<boolean> {
  const { data: mission } = await supabase
    .from('missions')
    .select('target_value')
    .eq('id', missionId)
    .single()

  const status = mission?.target_value && currentValue >= mission.target_value ? 'completed' : 'active'

  const { error } = await supabase
    .from('missions')
    .update({ current_value: currentValue, status })
    .eq('id', missionId)

  return !error
}

// ================================
// スキル関連
// ================================

export async function getSkills(organizationId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skill_masters')
    .select('*')
    .eq('organization_id', organizationId)
    .order('category')
    .order('sort_order')

  if (error) return []
  return data || []
}

export async function getUserSkills(userId: string): Promise<SkillAcquisition[]> {
  const { data, error } = await supabase
    .from('skill_acquisitions')
    .select('*, skill:skill_masters(*)')
    .eq('user_id', userId)

  if (error || !data) return []

  return (data as any[]).map(item => ({
    ...item,
    skill: Array.isArray(item.skill) ? item.skill[0] : item.skill
  }))
}

export async function acquireSkill(userId: string, skillId: string, certifiedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('skill_acquisitions')
    .insert({
      user_id: userId,
      skill_id: skillId,
      certified_by: certifiedBy,
      acquired_at: new Date().toISOString(),
    })

  return !error
}

// ================================
// 通知関連
// ================================

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body, data, is_read: false })

  return !error
}

export async function getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  return !error
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count || 0
}
