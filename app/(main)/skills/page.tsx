'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { getSkills, getUserSkills } from '@/lib/database'
import { Header, BottomNav, Loading } from '@/components/common'
import type { Skill, SkillAcquisition } from '@/types'

interface SkillWithStatus extends Skill {
  status: 'acquired' | 'locked'
  acquiredAt?: string
}

interface SkillCategory {
  name: string
  skills: SkillWithStatus[]
}

export default function SkillsPage() {
  const user = useAuthStore((s) => s.user)
  const store = useAuthStore((s) => s.store)
  
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, acquired: 0 })

  useEffect(() => {
    if (user && store) {
      loadSkills()
    }
  }, [user, store])

  const loadSkills = async () => {
    if (!user || !store) return
    setIsLoading(true)
    
    try {
      const [allSkills, userSkills] = await Promise.all([
        getSkills(store.organization_id),
        getUserSkills(user.id),
      ])
      
      const acquiredMap = new Map(userSkills.map(s => [s.skill_id, s.acquired_at]))
      
      const skillsWithStatus: SkillWithStatus[] = allSkills.map(skill => ({
        ...skill,
        status: acquiredMap.has(skill.id) ? 'acquired' : 'locked',
        acquiredAt: acquiredMap.get(skill.id),
      }))
      
      // カテゴリ別にグループ化
      const categoryMap = new Map<string, SkillWithStatus[]>()
      skillsWithStatus.forEach(skill => {
        const existing = categoryMap.get(skill.category) || []
        categoryMap.set(skill.category, [...existing, skill])
      })
      
      const categoriesArray: SkillCategory[] = Array.from(categoryMap.entries()).map(([name, skills]) => ({
        name,
        skills: skills.sort((a, b) => a.sort_order - b.sort_order),
      }))
      
      setCategories(categoriesArray)
      setSummary({
        total: allSkills.length,
        acquired: userSkills.length,
      })
    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <Loading message="スキル読み込み中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <Header 
        title="スキルマップ" 
        showBack 
        backHref="/" 
        badge={`${summary.acquired}/${summary.total}`} 
      />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* サマリー */}
        <div className="card p-4">
          <div className="flex justify-around mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.acquired}</div>
              <div className="text-xs text-gray-500">習得済</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{summary.total - summary.acquired}</div>
              <div className="text-xs text-gray-500">未習得</div>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${summary.total > 0 ? (summary.acquired / summary.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* カテゴリ別スキル */}
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            スキルが登録されていません
          </div>
        ) : (
          categories.map((category) => {
            const acquiredCount = category.skills.filter(s => s.status === 'acquired').length
            
            return (
              <div key={category.name} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{category.name}</span>
                    <span className="text-xs text-gray-500">({acquiredCount}/{category.skills.length})</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === category.name ? 'rotate-90' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {expandedCategory === category.name && (
                  <div className="border-t border-gray-100 p-4 space-y-2 animate-fadeIn">
                    {category.skills.map((skill) => (
                      <div 
                        key={skill.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          skill.status === 'acquired' 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{skill.icon}</span>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${skill.status === 'locked' ? 'text-gray-400' : ''}`}>
                            {skill.name}
                          </div>
                          {skill.description && (
                            <div className="text-xs text-gray-500">{skill.description}</div>
                          )}
                        </div>
                        {skill.status === 'acquired' ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
