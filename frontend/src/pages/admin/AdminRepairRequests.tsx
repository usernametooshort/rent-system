import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { Wrench, Clock, CheckCircle, Settings } from 'lucide-react'
import { Dialog } from '@headlessui/react'

interface RepairRequest {
    id: string
    title: string
    description: string
    status: 'pending' | 'processing' | 'completed'
    note?: string
    createdAt: string
    tenant: {
        id: string
        name: string
        phone: string
        room: {
            id: string
            roomNumber: string
        }
    }
    images: {
        id: string
        url: string
    }[]
}

const AdminRepairRequests: React.FC = () => {
    const queryClient = useQueryClient()
    const [processingRequest, setProcessingRequest] = useState<RepairRequest | null>(null)
    const [newStatus, setNewStatus] = useState<'processing' | 'completed'>('processing')
    const [note, setNote] = useState('')
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // 获取报修列表
    const { data, isLoading } = useQuery({
        queryKey: ['admin-repair-requests'],
        queryFn: async () => {
            const res = await client.get('/repair-requests', { params: { limit: 100 } })
            return res.data.data.items as RepairRequest[]
        }
    })

    // 处理报修
    const processMutation = useMutation({
        mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
            await client.put(`/repair-requests/${id}`, { status, note })
        },
        onSuccess: () => {
            toast.success('处理成功')
            queryClient.invalidateQueries({ queryKey: ['admin-repair-requests'] })
            setProcessingRequest(null)
            setNote('')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '处理失败')
        }
    })

    const handleProcess = () => {
        if (!processingRequest) return
        processMutation.mutate({
            id: processingRequest.id,
            status: newStatus,
            note: note || undefined
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1"><Clock size={12} /> 待处理</span>
            case 'processing':
                return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><Settings size={12} /> 处理中</span>
            case 'completed':
                return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle size={12} /> 已完成</span>
            default:
                return null
        }
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wrench size={20} /> 报修管理
            </h2>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">加载中...</div>
                ) : data?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">暂无报修申请</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {data?.map((req) => (
                            <div key={req.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold">{req.tenant.room.roomNumber}室</span>
                                            <span className="text-gray-500">-</span>
                                            <span className="text-gray-700">{req.tenant.name}</span>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <div className="font-medium text-gray-900 mt-1">{req.title}</div>
                                        <div className="text-sm text-gray-500 mt-1">{req.description}</div>

                                        {/* 图片列表 */}
                                        {req.images && req.images.length > 0 && (
                                            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                                {req.images.map((img) => (
                                                    <img
                                                        key={img.id}
                                                        src={img.url}
                                                        alt="报修图片"
                                                        className="h-20 w-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90"
                                                        onClick={() => setPreviewImage(img.url)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-400 mt-2">
                                            提交时间: {new Date(req.createdAt).toLocaleString('zh-CN')}
                                        </div>
                                        {req.note && (
                                            <div className="text-sm text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded">
                                                处理备注: {req.note}
                                            </div>
                                        )}
                                    </div>

                                    {req.status !== 'completed' && (
                                        <button
                                            onClick={() => {
                                                setProcessingRequest(req)
                                                setNewStatus(req.status === 'pending' ? 'processing' : 'completed')
                                            }}
                                            className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
                                        >
                                            {req.status === 'pending' ? '开始处理' : '标记完成'}
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
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4">
                            处理报修
                        </Dialog.Title>

                        {processingRequest && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div><strong>房间:</strong> {processingRequest.tenant.room.roomNumber}室</div>
                                    <div><strong>问题:</strong> {processingRequest.title}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                                    <select
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value as 'processing' | 'completed')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="processing">处理中</option>
                                        <option value="completed">已完成</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        rows={3}
                                        placeholder="维修详情、预计时间等..."
                                    />
                                </div>

                                <button
                                    onClick={handleProcess}
                                    disabled={processMutation.isPending}
                                    className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                                >
                                    确认
                                </button>

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

            {/* 图片预览 Modal */}
            <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex justify-center">
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="预览"
                                className="max-w-full max-h-[90vh] object-contain rounded"
                                onClick={() => setPreviewImage(null)}
                            />
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default AdminRepairRequests
