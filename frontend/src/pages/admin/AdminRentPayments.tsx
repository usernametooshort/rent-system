import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { Check, X } from 'lucide-react'

interface RentRecord {
    id: string
    month: string
    amount: number
    type: 'RENT' | 'DEPOSIT'
    paid: boolean
    paidAt?: string
}

interface Tenant {
    id: string
    name: string
    phone: string
    room: {
        id: string
        roomNumber: string
        rent: number
    }
    rentRecords: RentRecord[]
}

const AdminRentPayments: React.FC = () => {
    const queryClient = useQueryClient()

    // 获取租客列表（含租金记录）
    const { data, isLoading } = useQuery({
        queryKey: ['admin-tenants-with-rent'],
        queryFn: async () => {
            const res = await client.get('/tenants', { params: { limit: 100 } })
            return res.data.data.items as Tenant[]
        }
    })

    // 更新租金记录（标记已缴/未缴）
    const updateRentMutation = useMutation({
        mutationFn: async ({ tenantId, recordId, paid }: { tenantId: string; recordId: string; paid: boolean }) => {
            await client.put(`/tenants/${tenantId}/rent-records/${recordId}`, { paid })
        },
        onSuccess: () => {
            toast.success('更新成功')
            queryClient.invalidateQueries({ queryKey: ['admin-tenants-with-rent'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '更新失败')
        }
    })


    return (
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">租金管理</h2>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">加载中...</div>
                ) : data?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">暂无租客</div>
                ) : (
                    data?.map((tenant) => (
                        <div key={tenant.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="font-bold text-lg">{tenant.room?.roomNumber || '未绑定'}室</span>
                                    <span className="text-gray-500 ml-2">- {tenant.name}</span>
                                    <span className="text-sm text-gray-400 ml-2">{tenant.phone}</span>
                                </div>
                            </div>

                            {/* 租金记录 */}
                            <div className="space-y-2">
                                {(!tenant.rentRecords || tenant.rentRecords.length === 0) ? (
                                    <div className="text-sm text-gray-400 text-center py-2">暂无租金记录</div>
                                ) : (
                                    tenant.rentRecords.slice(0, 6).map((record) => (
                                        <div key={record.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none ${record.type === 'DEPOSIT' ? 'bg-purple-500 text-white' : 'bg-gray-400 text-white'
                                                    }`}>
                                                    {record.type === 'DEPOSIT' ? '押金' : '房租'}
                                                </span>
                                                <span className="font-medium">{record.month}</span>
                                                <span className="text-gray-600 font-bold">¥{record.amount}</span>
                                                {record.paid ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <Check size={10} /> 已缴
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <X size={10} /> 未缴
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => updateRentMutation.mutate({
                                                    tenantId: tenant.id,
                                                    recordId: record.id,
                                                    paid: !record.paid
                                                })}
                                                disabled={updateRentMutation.isPending}
                                                className={`text-xs px-2 py-1 rounded ${record.paid
                                                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                    } disabled:opacity-50`}
                                            >
                                                {record.paid ? '标记未缴' : '标记已缴'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default AdminRentPayments
