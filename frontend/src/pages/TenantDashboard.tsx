import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Room, RoomStatus } from '../types'
import { format } from 'date-fns'
import { Loader2, Calendar, CreditCard, PenTool, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog } from '@headlessui/react'

// 子组件：租金记录卡片
const RentHistoryCard = ({ records }: { records: any[] }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-primary-500" />
            租金记录
        </h3>
        <div className="space-y-3">
            {records?.map((record) => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                        <div className="font-medium text-gray-900">{record.month} 账单</div>
                        <div className="text-xs text-gray-500">
                            {record.paid ? `支付于 ${format(new Date(record.paidAt), 'yyyy-MM-dd')}` : '未支付'}
                        </div>
                    </div>
                    <div className={`font-bold ${record.paid ? 'text-green-600' : 'text-red-500'}`}>
                        {record.paid ? '已缴' : '未缴'} ¥{record.amount}
                    </div>
                </div>
            ))}
            {(!records || records.length === 0) && (
                <div className="text-center text-gray-400 text-sm py-4">暂无记录</div>
            )}
        </div>
    </div>
)

// 子组件：设备列表
const ApplianceList = ({ appliances }: { appliances: any[] }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <PenTool size={18} className="text-primary-500" />
            房屋配置
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {appliances?.map(app => (
                <div key={app.id} className="bg-gray-50 p-2 rounded-lg text-sm">
                    <div className="font-medium text-gray-900">{app.name}</div>
                    <div className="text-xs text-gray-500">赔偿基准 ¥{app.compensationPrice}</div>
                </div>
            ))}
        </div>
    </div>
)

// 主组件
const TenantDashboard: React.FC = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false)
    const [moveOutDate, setMoveOutDate] = useState('')

    // 获取房间详情（包含租客自己的信息）
    const { data: room, isLoading } = useQuery({
        queryKey: ['my-room'],
        queryFn: async () => {
            // 租客只能通过 /my-room 路径或者直接请求自己的ID，这里假设后端有一个 redirect 或者 filter
            // 为了简单，我们直接复用 getRoomById，后端会校验 ownership
            // 但前端怎么知道 roomId? 登录返回了 roomId
            if (!user?.roomId) return null
            const res = await client.get(`/rooms/${user.roomId}`)
            return res.data.data as Room
        },
        enabled: !!user?.roomId
    })

    // 提交退租申请
    const moveOutMutation = useMutation({
        mutationFn: async (date: string) => {
            const res = await client.post('/move-out-requests', {
                preferredInspectionDate: new Date(date).toISOString()
            })
            return res.data
        },
        onSuccess: () => {
            toast.success('申请提交成功')
            setIsMoveOutModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['my-requests'] }) // 刷新申请列表
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '提交失败')
        }
    })

    if (isLoading) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-primary-500" />
            </div>
        )
    }

    if (!room) return <div>未找到房屋信息</div>

    // 提取租客信息（实际上 API 返回的 room.tenant 就是自己）
    const tenantInfo = room.tenant as any

    return (
        <div>
            {/* 头部概览 */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-6 text-white shadow-lg mb-6">
                <h2 className="text-2xl font-bold mb-1">{room.roomNumber} 室</h2>
                <div className="flex items-center gap-2 opacity-90 text-sm">
                    <Calendar size={14} />
                    <span>起租日期: {format(new Date(tenantInfo.leaseStartDate), 'yyyy-MM-dd')}</span>
                </div>
                <div className="mt-6 flex justify-between items-end">
                    <div>
                        <div className="text-primary-100 text-sm">月租金</div>
                        <div className="text-3xl font-bold">¥{room.rent}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-primary-100 text-sm">押金</div>
                        <div className="font-semibold">¥{room.deposit}</div>
                    </div>
                </div>
            </div>

            {/* 快捷操作 */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setIsMoveOutModalOpen(true)}
                    className="flex-1 bg-white p-3 rounded-xl shadow-sm text-center active:scale-95 transition-transform"
                >
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <LogOutIcon size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">预约退租</span>
                </button>
            </div>

            {/* 租金记录 */}
            <RentHistoryCard records={tenantInfo.rentRecords} />

            {/* 房屋配置 */}
            <ApplianceList appliances={room.appliances} />

            {/* 退租 Modal */}
            <Dialog
                open={isMoveOutModalOpen}
                onClose={() => setIsMoveOutModalOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4">预约退租验房</Dialog.Title>
                        <p className="text-sm text-gray-500 mb-4">
                            请选择期望的验房日期，管理员确认后将与您联系。
                        </p>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg p-2 mb-6"
                            onChange={(e) => setMoveOutDate(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsMoveOutModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => moveOutDate && moveOutMutation.mutate(moveOutDate)}
                                disabled={!moveOutDate || moveOutMutation.isPending}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {moveOutMutation.isPending ? '提交中...' : '提交申请'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

function LogOutIcon({ size }: { size: number }) {
    // 简易图标，实际应该 import
    return <AlertCircle size={size} />
}

export default TenantDashboard
