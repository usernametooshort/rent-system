import React from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { format } from 'date-fns'
import {
    X,
    Calendar,
    CreditCard,
    Wrench,
    LogOut,
    CheckCircle2,
    AlertCircle,
    User,
    Home
} from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { getImageUrl } from '../../utils/url'

interface HistoryEntry {
    id: string
    type: 'PAYMENT' | 'REPAIR' | 'CHECKOUT'
    date: string
    title: string
    status: string
    amount?: number
    details?: any
}

interface TenantHistoryModalProps {
    isOpen: boolean
    onClose: () => void
    tenantId?: string
    roomId?: string
}

const TenantHistoryModal: React.FC<TenantHistoryModalProps> = ({ isOpen, onClose, tenantId: initialTenantId, roomId }) => {
    const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined)

    // 如果 initialTenantId 变换，更新 selectedId
    React.useEffect(() => {
        setSelectedId(initialTenantId)
    }, [initialTenantId])

    // 如果从房间进入，获取该房间的所有历史场次
    const { data: roomHistory, isLoading: loadingRoom } = useQuery({
        queryKey: ['room-history', roomId],
        queryFn: async () => {
            if (!roomId) return null
            const res = await client.get(`/rooms/${roomId}/history`)
            return res.data.data
        },
        enabled: !!roomId && !selectedId
    })

    // 获取特定租客/场次的完整详情
    const currentId = selectedId || initialTenantId
    const { data: tenant, isLoading: loadingTenant } = useQuery({
        queryKey: ['tenant-full-history', currentId],
        queryFn: async () => {
            if (!currentId) return null
            const res = await client.get(`/tenants/${currentId}`)
            return res.data.data
        },
        enabled: !!currentId
    })

    if (!isOpen) return null

    // 合并记录为时间轴 (仅在有 tenant 时)
    const timeline: HistoryEntry[] = []
    if (tenant) {
        tenant.rentRecords?.forEach((r: any) => {
            timeline.push({
                id: r.id,
                type: 'PAYMENT',
                date: r.paidAt || r.createdAt,
                title: r.type === 'DEPOSIT' ? '押金缴纳' : `${r.month} 房租`,
                status: r.paid ? '已支付' : '未支付',
                amount: r.amount,
                details: r
            })
        })
        tenant.repairRequests?.forEach((r: any) => {
            timeline.push({
                id: r.id,
                type: 'REPAIR',
                date: r.createdAt,
                title: `报修: ${r.title}`,
                status: r.status === 'fixed' ? '已修复' : '处理中',
                details: r
            })
        })
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    const showStayList = !!roomId && !selectedId

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-gray-50 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            {selectedId && roomId && (
                                <button
                                    onClick={() => setSelectedId(undefined)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                                >
                                    <X size={18} className="rotate-90" />
                                </button>
                            )}
                            <div>
                                <Dialog.Title className="text-xl font-bold text-gray-900">
                                    {showStayList ? '房间租赁历史场次' : (tenant ? `${tenant.name} 的租赁档案` : '加载中...')}
                                </Dialog.Title>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {showStayList ? '选择过往的一次租约查看详情' : '查看过往的支付、报修及退租详情'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loadingRoom || (currentId && loadingTenant) ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : showStayList ? (
                            /* 场次列表视图 */
                            <div className="space-y-3">
                                {roomHistory?.length > 0 ? roomHistory.map((stay: any) => (
                                    <button
                                        key={stay.id}
                                        onClick={() => setSelectedId(stay.tenantPhone)}
                                        className="w-full bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all text-left flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{stay.tenantName}</div>
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    退租日期: {format(new Date(stay.checkoutDate), 'yyyy-MM-dd')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-primary-600">查看详情</div>
                                            <div className="text-[10px] text-gray-400 mt-1">退押 ¥{stay.depositRefunded}</div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <Home size={40} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400">该房间暂无历史租赁记录</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* 详细档案视图 (时间轴) */
                            <>
                                {/* 概览卡片 */}
                                {tenant && (
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">租客姓名</div>
                                                <div className="font-bold text-gray-900">{tenant.name}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                                <Home size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">曾租房间</div>
                                                <div className="font-bold text-gray-900">{tenant.room?.roomNumber || roomHistory?.[0]?.roomNumber || '未知'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 col-span-2 pt-2 border-t border-gray-50 text-sm text-gray-600">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span className="font-medium">租赁周期:</span>
                                            <span>
                                                {format(new Date(tenant.leaseStartDate), 'yyyy.MM.dd')}
                                                {tenant.checkOutDate ? ` - ${format(new Date(tenant.checkOutDate), 'yyyy.MM.dd')}` : ' (至今)'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 时间轴内容 */}
                                <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                    {timeline.length > 0 ? timeline.map((entry) => (
                                        <div key={entry.id} className="relative pl-12">
                                            {/* (同之前的 Timeline 代码，此处略过，保持一致) */}
                                            {/* Icon Circle */}
                                            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center z-10 ${entry.type === 'PAYMENT' ? 'bg-green-100 text-green-600' :
                                                entry.type === 'REPAIR' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {entry.type === 'PAYMENT' ? <CreditCard size={18} /> :
                                                    entry.type === 'REPAIR' ? <Wrench size={18} /> :
                                                        <LogOut size={18} />}
                                            </div>

                                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-gray-200 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{entry.title}</h4>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                                                            {format(new Date(entry.date), 'yyyy年MM月dd日 HH:mm')}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${entry.status.includes('已') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {entry.status}
                                                    </span>
                                                </div>

                                                {entry.type === 'PAYMENT' && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">金额</span>
                                                        <span className="font-bold text-gray-900 text-lg">¥{entry.amount}</span>
                                                    </div>
                                                )}

                                                {entry.type === 'REPAIR' && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-gray-600 leading-relaxed">{entry.details.description}</p>
                                                        {entry.details.images?.length > 0 && (
                                                            <div className="flex gap-2 mt-3">
                                                                {entry.details.images.map((img: any) => (
                                                                    <img
                                                                        key={img.id}
                                                                        src={getImageUrl(img.url)}
                                                                        className="w-16 h-16 rounded-lg object-cover border border-gray-100 shadow-sm"
                                                                        alt="报修图片"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10">
                                            <p className="text-gray-400">暂无相关历史记录</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white px-6 py-4 border-t border-gray-100 shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-900 text-white py-3 rounded-2xl font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                        >
                            关闭档案
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default TenantHistoryModal
