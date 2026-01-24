'use client'

import { Header } from '@/components/common'

export default function AdminMissionsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="ミッション管理" showBack backHref="/" variant="manager" />
            <div className="p-4 text-center text-gray-500">
                ミッション管理機能は現在準備中です。
            </div>
        </div>
    )
}
