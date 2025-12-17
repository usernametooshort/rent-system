import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '../contexts/AuthContext'
import { LogOut } from 'lucide-react'

const Layout: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white shadow-sm h-14 flex items-center justify-between px-4 sticky top-0 z-10">
                <h1 className="font-bold text-lg text-gray-900">
                    {user?.role === 'admin' ? '业主管理端' : '我的家'}
                </h1>
                <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="退出登录"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Main Content */}
            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    )
}

export default Layout
