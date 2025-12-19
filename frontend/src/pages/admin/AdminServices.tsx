import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { DoorOpen, DollarSign, Wrench, Users, Megaphone, Shield, CreditCard } from 'lucide-react'
import AdminAnnouncements from './AdminAnnouncements'
import AdminMoveOutRequests from './AdminMoveOutRequests'
import AdminRentPayments from './AdminRentPayments'
import AdminRepairRequests from './AdminRepairRequests'
import AdminTenants from './AdminTenants'
import AdminManagement from './AdminManagement'
import AdminPaymentConfirm from './AdminPaymentConfirm'

type Tab = 'tenants' | 'announcements' | 'moveout' | 'rent' | 'repair' | 'admins' | 'payment'

const AdminServices: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('tenants')

    // 获取待确认付款数量
    const { data: pendingData } = useQuery({
        queryKey: ['pending-payment-count'],
        queryFn: async () => {
            const res = await client.get('/payment/pending-count')
            return res.data.data
        },
        refetchInterval: 30000
    })
    const pendingCount = pendingData?.count || 0

    const tabs = [
        { id: 'tenants' as Tab, label: '租客', icon: Users },
        { id: 'admins' as Tab, label: '管理员', icon: Shield },
        { id: 'announcements' as Tab, label: '公告', icon: Megaphone },
        { id: 'moveout' as Tab, label: '退租申请', icon: DoorOpen },
        { id: 'rent' as Tab, label: '租金管理', icon: DollarSign },
        { id: 'payment' as Tab, label: '付款确认', icon: CreditCard, badge: pendingCount },
        { id: 'repair' as Tab, label: '报修管理', icon: Wrench },
    ]

    return (
        <div>
            {/* Tab 导航 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(({ id, label, icon: Icon, badge }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Icon size={16} />
                        {label}
                        {badge ? (
                            <span className="ml-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* Tab 内容 */}
            {activeTab === 'tenants' && <AdminTenants />}
            {activeTab === 'announcements' && <AdminAnnouncements />}
            {activeTab === 'moveout' && <AdminMoveOutRequests />}
            {activeTab === 'rent' && <AdminRentPayments />}
            {activeTab === 'payment' && <AdminPaymentConfirm />}
            {activeTab === 'repair' && <AdminRepairRequests />}
            {activeTab === 'admins' && <AdminManagement />}
        </div>
    )
}

export default AdminServices
