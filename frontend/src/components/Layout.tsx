import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Settings } from 'lucide-react'
import ChangePasswordModal from './ChangePasswordModal'

const Layout: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white shadow-sm h-14 flex items-center justify-between px-4 sticky top-0 z-10">
                <h1 className="font-bold text-lg text-gray-900">
                    {user?.role === 'admin' ? '业主管理端' : '我的家'}
                </h1>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-gray-500 hover:text-primary-600 transition-colors"
                        title="账号设置"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={logout}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="退出登录"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Modals */}
            <ChangePasswordModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    )
}

export default Layout
