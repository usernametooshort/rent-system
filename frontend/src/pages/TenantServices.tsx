import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { format } from 'date-fns'
import { Loader2, Wrench, Plus, Clock, Settings, CheckCircle, Camera, X, Image as ImageIcon } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'

// 公告卡片
const AnnouncementCard = ({ item }: { item: any }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-3 border-l-4 border-primary-500">
        <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-3">{item.content}</p>
        <div className="text-xs text-gray-400">
            发布于 {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
        </div>
    </div>
)

// 退租申请状态卡片
const MoveOutRequestCard = ({ item }: { item: any }) => {
    const statusMap: any = {
        pending: { text: '审核中', color: 'text-orange-500 bg-orange-50' },
        approved: { text: '已通过', color: 'text-green-500 bg-green-50' },
        rejected: { text: '已驳回', color: 'text-red-500 bg-red-50' }
    }
    const status = statusMap[item.status]

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">退租申请</span>
                <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                    {status.text}
                </span>
            </div>
            <div className="text-sm text-gray-500">
                期望验房: {format(new Date(item.preferredInspectionDate), 'yyyy-MM-dd')}
            </div>
            {item.note && (
                <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-600">
                    管理员回复: {item.note}
                </div>
            )}
        </div>
    )
}

// 报修申请状态卡片
const RepairRequestCard = ({ item }: { item: any }) => {
    const statusMap: any = {
        pending: { text: '待处理', icon: Clock, color: 'text-yellow-700 bg-yellow-100' },
        processing: { text: '处理中', icon: Settings, color: 'text-blue-700 bg-blue-100' },
        completed: { text: '已完成', icon: CheckCircle, color: 'text-green-700 bg-green-100' }
    }
    const status = statusMap[item.status]
    const Icon = status.icon

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{item.title}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                    <Icon size={12} /> {status.text}
                </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">{item.description}</div>
            <div className="text-xs text-gray-400">
                提交于 {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
            </div>
            {item.note && (
                <div className="mt-2 text-sm bg-blue-50 p-2 rounded text-blue-700">
                    处理备注: {item.note}
                </div>
            )}
        </div>
    )
}

const TenantServices: React.FC = () => {
    const queryClient = useQueryClient()
    const [isRepairModalOpen, setIsRepairModalOpen] = useState(false)
    const [repairTitle, setRepairTitle] = useState('')
    const [repairDesc, setRepairDesc] = useState('')
    const [repairImages, setRepairImages] = useState<File[]>([])
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 获取公告
    const { data: announcements, isLoading: loadingAnnounce } = useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await client.get('/announcements')
            return res.data.data.items
        }
    })

    // 获取退租申请记录
    const { data: moveOutRequests, isLoading: loadingMoveOut } = useQuery({
        queryKey: ['my-move-out-requests'],
        queryFn: async () => {
            const res = await client.get('/move-out-requests/my')
            return res.data.data
        }
    })

    // 获取报修申请记录
    const { data: repairRequests, isLoading: loadingRepair } = useQuery({
        queryKey: ['my-repair-requests'],
        queryFn: async () => {
            const res = await client.get('/repair-requests/my')
            return res.data.data
        }
    })

    // 提交报修
    const submitRepairMutation = useMutation({
        mutationFn: async (data: { title: string; description: string; imageUrls?: string[] }) => {
            await client.post('/repair-requests', data)
        },
        onSuccess: () => {
            toast.success('报修提交成功')
            queryClient.invalidateQueries({ queryKey: ['my-repair-requests'] })
            setIsRepairModalOpen(false)
            setRepairTitle('')
            setRepairDesc('')
            setRepairImages([])
            setImagePreviewUrls([])
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '提交失败')
        }
    })

    // 处理图片选择
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + repairImages.length > 5) {
            toast.error('最多上传5张图片')
            return
        }

        // 添加新图片
        setRepairImages(prev => [...prev, ...files])

        // 生成预览URL
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreviewUrls(prev => [...prev, e.target?.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    // 移除图片
    const handleRemoveImage = (index: number) => {
        setRepairImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmitRepair = async () => {
        if (!repairTitle.trim()) {
            toast.error('请输入报修标题')
            return
        }

        try {
            setIsUploading(true)
            let imageUrls: string[] = []

            // 上传图片
            if (repairImages.length > 0) {
                for (const file of repairImages) {
                    const formData = new FormData()
                    formData.append('file', file)
                    const res = await client.post('/upload/image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    imageUrls.push(res.data.data.url)
                }
            }

            // 提交报修
            submitRepairMutation.mutate({
                title: repairTitle.trim(),
                description: repairDesc.trim(),
                imageUrls: imageUrls.length > 0 ? imageUrls : undefined
            })
        } catch (err: any) {
            toast.error('图片上传失败')
        } finally {
            setIsUploading(false)
        }
    }

    if (loadingAnnounce || loadingMoveOut || loadingRepair) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">社区服务</h2>

            {/* 报修入口按钮 */}
            <button
                onClick={() => setIsRepairModalOpen(true)}
                className="w-full mb-6 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
            >
                <Wrench size={18} /> 提交报修
            </button>

            {/* 我的报修 */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">我的报修</h3>
                {repairRequests?.length > 0 ? (
                    repairRequests.map((req: any) => <RepairRequestCard key={req.id} item={req} />)
                ) : (
                    <div className="text-center text-gray-400 text-sm py-4 bg-white rounded-xl">无报修记录</div>
                )}
            </div>

            {/* 我的退租申请 */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">退租申请</h3>
                {moveOutRequests?.length > 0 ? (
                    moveOutRequests.map((req: any) => <MoveOutRequestCard key={req.id} item={req} />)
                ) : (
                    <div className="text-center text-gray-400 text-sm py-4 bg-white rounded-xl">无申请记录</div>
                )}
            </div>

            {/* 最新公告 */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">最新公告</h3>
                {announcements?.length > 0 ? (
                    announcements.map((anno: any) => <AnnouncementCard key={anno.id} item={anno} />)
                ) : (
                    <div className="text-center text-gray-400 text-sm py-4 bg-white rounded-xl">暂无公告</div>
                )}
            </div>

            {/* 报修弹窗 */}
            <Dialog open={isRepairModalOpen} onClose={() => setIsRepairModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Wrench size={20} /> 提交报修
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">问题标题</label>
                                <input
                                    type="text"
                                    value={repairTitle}
                                    onChange={e => setRepairTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="如：卫生间水龙头漏水"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
                                <textarea
                                    value={repairDesc}
                                    onChange={e => setRepairDesc(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="请描述具体情况..."
                                />
                            </div>

                            {/* 图片上传区域 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <ImageIcon size={14} className="inline mr-1" />
                                    添加照片（可选，最多5张）
                                </label>

                                {/* 图片预览网格 */}
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {imagePreviewUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* 添加图片按钮 */}
                                    {repairImages.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                                        >
                                            <Camera size={20} className="text-gray-400" />
                                            <span className="text-xs text-gray-400 mt-1">添加</span>
                                        </button>
                                    )}
                                </div>

                                {/* 隐藏的文件输入 */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>

                            <button
                                onClick={handleSubmitRepair}
                                disabled={submitRepairMutation.isPending || isUploading}
                                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                            >
                                {isUploading ? '上传图片中...' : submitRepairMutation.isPending ? '提交中...' : '提交报修'}
                            </button>

                            <button
                                onClick={() => setIsRepairModalOpen(false)}
                                className="w-full text-gray-500 text-sm py-2"
                            >
                                取消
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default TenantServices
