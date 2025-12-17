import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, PieChart, User, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'

const BottomNav: React.FC = () => {
    const { user } = useAuth()

    if (!user) return null

    // Admin routes:
    // - /admin -> AdminRooms (Home icon, "房源")
    // - /admin/services -> 服务管理 (Wrench icon, "服务") - includes 租客/退租/租金/报修
    // - /admin/stats -> AdminDashboard (PieChart icon, "统计")

    const adminLinks = [
        { to: '/admin', icon: Home, label: '房源', end: true },
        { to: '/admin/services', icon: Wrench, label: '服务' },
        { to: '/admin/stats', icon: PieChart, label: '统计' },
    ]

    const tenantLinks = [
        { to: '/tenant', icon: Home, label: '我的房间', end: true },
        { to: '/tenant/services', icon: User, label: '服务' },
    ]

    const links = user.role === 'admin' ? adminLinks : tenantLinks

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
            <div className="flex justify-around items-center h-16">
                {links.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            clsx(
                                'flex flex-col items-center justify-center w-full h-full space-y-1',
                                isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                            )
                        }
                    >
                        <Icon size={24} />
                        <span className="text-xs font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

export default BottomNav
