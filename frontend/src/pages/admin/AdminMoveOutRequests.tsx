import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, MessageSquare, Plus, Trash2, DollarSign } from 'lucide-react'
import { Dialog } from '@headlessui/react'

interface DeductionItem {
    name: string
    amount: number
}

interface MoveOutRequest {
    id: string
    preferredInspectionDate: string
    status: 'pending' | 'approved' | 'rejected'
    note?: string
    refundAmount?: number
    refundPlan?: string // JSON string
    createdAt: string
    tenant: {
        id: string
        name: string
        phone: string
        room: {
            id: string
            roomNumber: string
            deposit: number
        }
    }
}

const AdminMoveOutRequests: React.FC = () => {
    const queryClient = useQueryClient()
    const [processingRequest, setProcessingRequest] = useState<MoveOutRequest | null>(null)
    const [note, setNote] = useState('')
    const [deductions, setDeductions] = useState<DeductionItem[]>([])
    const [newDeductionName, setNewDeductionName] = useState('')
    const [newDeductionAmount, setNewDeductionAmount] = useState('')

    // 获取退租申请列表
    const { data, isLoading } = useQuery({
        queryKey: ['admin-move-out-requests'],
        queryFn: async () => {
            const res = await client.get('/move-out-requests', { params: { limit: 100 } })
            return res.data.data.items as MoveOutRequest[]
        }
    })

    // 处理申请
    const processMutation = useMutation({
        mutationFn: async ({ id, status, note, refundAmount, refundPlan }: {
            id: string;
            status: 'approved' | 'rejected';
            note?: string;
            refundAmount?: number;
            refundPlan?: DeductionItem[];
        }) => {
            await client.put(`/move-out-requests/${id}`, { status, note, refundAmount, refundPlan })
        },
        onSuccess: () => {
            toast.success('处理成功')
            queryClient.invalidateQueries({ queryKey: ['admin-move-out-requests'] })
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
            queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
            setProcessingRequest(null)
            setNote('')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '处理失败')
        }
    })

    const handleProcess = (status: 'approved' | 'rejected') => {
        if (!processingRequest) return

        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
        const refundAmount = Math.max(0, (processingRequest.tenant.room?.deposit || 0) - totalDeductions)

        processMutation.mutate({
            id: processingRequest.id,
            status,
            note: note || undefined,
            refundAmount: status === 'approved' ? refundAmount : undefined,
            refundPlan: status === 'approved' ? deductions : undefined
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Clock size={12} /> 待处理</span>
            case 'approved':
                return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle size={12} /> 已批准</span>
            case 'rejected':
                return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1"><XCircle size={12} /> 已拒绝</span>
            default:
                return null
        }
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">退租申请管理</h2>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">加载中...</div>
                ) : data?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">暂无退租申请</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {data?.map((req) => (
                            <div key={req.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold">{req.tenant?.room?.roomNumber || '?'}室</span>
                                            <span className="text-gray-500">-</span>
                                            <span className="text-gray-700">{req.tenant.name}</span>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            期望验房日期: {new Date(req.preferredInspectionDate).toLocaleDateString('zh-CN')}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            申请时间: {new Date(req.createdAt).toLocaleString('zh-CN')}
                                        </div>
                                        {req.note && (
                                            <div className="text-sm text-gray-600 mt-2 flex items-start gap-1">
                                                <MessageSquare size={14} className="mt-0.5" />
                                                <span>备注: {req.note}</span>
                                            </div>
                                        )}
                                    </div>

                                    {req.status === 'pending' && (
                                        <button
                                            onClick={() => setProcessingRequest(req)}
                                            className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
                                        >
                                            处理申请
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 处理弹窗 */}
            <Dialog open={!!processingRequest} onClose={() => setProcessingRequest(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <Dialog.Title className="text-lg font-bold mb-4">
                            处理退租申请
                        </Dialog.Title>

                        {processingRequest && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-2 gap-2">
                                    <div><strong>房间:</strong> {processingRequest.tenant?.room?.roomNumber || '?'}室</div>
                                    <div><strong>租客:</strong> {processingRequest.tenant.name}</div>
                                    <div className="col-span-2"><strong>期望验房:</strong> {new Date(processingRequest.preferredInspectionDate).toLocaleDateString('zh-CN')}</div>
                                    <div className="col-span-2"><strong>签约押金:</strong> ¥{processingRequest.tenant.room?.deposit}</div>
                                </div>

                                {/* 退款方案编辑 */}
                                <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/30">
                                    <label className="block text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <DollarSign size={14} /> 退款方案 (仅批准时生效)
                                    </label>

                                    <div className="space-y-2 mb-3">
                                        {deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg text-sm border border-purple-100">
                                                <span>{d.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-red-600">-¥{d.amount}</span>
                                                    <button onClick={() => setDeductions(deductions.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder="扣款项"
                                            value={newDeductionName}
                                            onChange={e => setNewDeductionName(e.target.value)}
                                            className="flex-1 text-xs border border-purple-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-purple-400 outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="金额"
                                            value={newDeductionAmount}
                                            onChange={e => setNewDeductionAmount(e.target.value)}
                                            className="w-20 text-xs border border-purple-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-purple-400 outline-none"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newDeductionName && newDeductionAmount) {
                                                    setDeductions([...deductions, { name: newDeductionName, amount: Number(newDeductionAmount) }])
                                                    setNewDeductionName('')
                                                    setNewDeductionAmount('')
                                                }
                                            }}
                                            className="bg-purple-600 text-white p-1.5 rounded-lg hover:bg-purple-700"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className="pt-2 border-t border-purple-100 text-sm">
                                        <div className="flex justify-between text-gray-500 text-xs mb-1">
                                            <span>押金总额</span>
                                            <span>¥{processingRequest.tenant.room?.deposit}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500 text-xs mb-2">
                                            <span>合计扣款</span>
                                            <span className="text-red-500">-¥{deductions.reduce((sum, d) => sum + d.amount, 0)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-purple-700">
                                            <span>预估实退</span>
                                            <span>¥{Math.max(0, (processingRequest.tenant.room?.deposit || 0) - deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">办理备注</label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                        rows={2}
                                        placeholder="确认验房时间、扣款原因说明等..."
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProcess('approved')}
                                        disabled={processMutation.isPending}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle size={16} /> 批准
                                    </button>
                                    <button
                                        onClick={() => handleProcess('rejected')}
                                        disabled={processMutation.isPending}
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        <XCircle size={16} /> 拒绝
                                    </button>
                                </div>

                                <button
                                    onClick={() => setProcessingRequest(null)}
                                    className="w-full text-gray-500 text-sm py-2"
                                >
                                    取消
                                </button>
                            </div>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default AdminMoveOutRequests
