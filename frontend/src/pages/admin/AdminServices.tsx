import React, { useState } from 'react'
import { DoorOpen, DollarSign, Wrench, Users, Megaphone } from 'lucide-react'
import AdminMoveOutRequests from './AdminMoveOutRequests'
import AdminRentPayments from './AdminRentPayments'
import AdminRepairRequests from './AdminRepairRequests'
import AdminTenants from './AdminTenants'
import AdminAnnouncements from './AdminAnnouncements'

type Tab = 'tenants' | 'announcements' | 'moveout' | 'rent' | 'repair'

const AdminServices: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('tenants')

    const tabs = [
        { id: 'tenants' as Tab, label: '租客', icon: Users },
        { id: 'announcements' as Tab, label: '公告', icon: Megaphone },
        { id: 'moveout' as Tab, label: '退租申请', icon: DoorOpen },
        { id: 'rent' as Tab, label: '租金管理', icon: DollarSign },
        { id: 'repair' as Tab, label: '报修管理', icon: Wrench },
    ]

    return (
        <div>
            {/* Tab 导航 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab 内容 */}
            {activeTab === 'tenants' && <AdminTenants />}
            {activeTab === 'announcements' && <AdminAnnouncements />}
            {activeTab === 'moveout' && <AdminMoveOutRequests />}
            {activeTab === 'rent' && <AdminRentPayments />}
            {activeTab === 'repair' && <AdminRepairRequests />}
        </div>
    )
}

export default AdminServices
