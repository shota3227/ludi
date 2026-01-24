// ユーザー
export interface User {
  id: string
  auth_id: string | null
  email: string
  name: string
  nickname: string
  role: 'system_admin' | 'headquarters_admin' | 'area_manager' | 'manager' | 'staff'
  primary_store_id: string | null
  avatar_id: string
  rank: number
  profile_text: string | null
  strengths: string | null
  weaknesses: string | null
  hobbies: string | null
  personality_type: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// 店舗
export interface Store {
  id: string
  organization_id: string
  name: string
  code: string
  address: string | null
  is_active: boolean
}

// ポイント取引
export interface PointTransaction {
  id: string
  from_user_id: string
  to_user_id: string
  point_type: 'thanks' | 'goodjob'
  points: number
  goodjob_category_id: string | null
  goodjob_free_text: string | null
  message: string | null
  created_at: string
  from_user?: User
  to_user?: User
  goodjob_category?: GoodJobCategory
}

// Good Jobカテゴリ
export interface GoodJobCategory {
  id: string
  organization_id: string
  name: string
  description: string | null
  icon: string
  sort_order: number
}

// 勤怠
export interface AttendanceRecord {
  id: string
  user_id: string
  store_id: string
  clock_in: string
  clock_out: string | null
  created_at: string
  store?: Store
}

// ミッション
export interface Mission {
  id: string
  store_id: string
  name: string
  description: string | null
  icon: string
  target_value: number | null
  current_value: number
  target_date: string
  points: number
  status: 'active' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

// スキル
export interface Skill {
  id: string
  organization_id: string
  name: string
  category: string
  description: string | null
  level: number
  icon: string
  sort_order: number
}

// スキル習得
export interface SkillAcquisition {
  id: string
  user_id: string
  skill_id: string
  certified_by: string
  acquired_at: string
  skill?: Skill
}

// 通知
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: any
  is_read: boolean
  created_at: string
}

// ポイントサマリー
export interface PointSummary {
  thanks_sent: number
  thanks_received: number
  goodjob_sent: number
  goodjob_received: number
}

// 認証状態
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
