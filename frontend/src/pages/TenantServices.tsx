import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { format } from 'date-fns'
import { Loader2, Wrench, Plus, Clock, Settings, CheckCircle, Camera, X, Image as ImageIcon } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import { getImageUrl } from '../utils/url'

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
    const refundPlan = item.refundPlan ? JSON.parse(item.refundPlan) : []

    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3 border border-gray-100">
            <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-gray-900">退租申请详情</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${status.color}`}>
                    {status.text}
                </span>
            </div>
            <div className="text-sm text-gray-600 mb-3 space-y-1">
                <div className="flex justify-between">
                    <span className="text-gray-400">期望验房时间</span>
                    <span className="font-medium text-gray-900">{format(new Date(item.preferredInspectionDate), 'yyyy-MM-dd')}</span>
                </div>
            </div>

            {/* 退款方案 */}
            {item.status === 'approved' && (item.refundAmount !== null || refundPlan.length > 0) && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">押金结算方案</div>
                    <div className="space-y-2 mb-3">
                        {refundPlan.map((d: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-500">{d.name}</span>
                                <span className="text-red-500 font-medium">-¥{d.amount}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 flex justify-between items-center">
                        <span className="text-sm font-bold text-green-700">预计退还总额</span>
                        <span className="text-lg font-black text-green-700 tracking-tighter">¥{item.refundAmount}</span>
                    </div>
                </div>
            )}

            {item.note && (
                <div className="mt-3 text-sm bg-gray-50 p-3 rounded-lg text-gray-600 border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">管理员备注</div>
                    {item.note}
                </div>
            )}
        </div>
    )
}

// 报修申请状态卡片
const RepairRequestCard = ({ item, onEdit, onDelete }: { item: any, onEdit: (item: any) => void, onDelete: (id: string) => void }) => {
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
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                        <Icon size={12} /> {status.text}
                    </span>
                    {item.status === 'pending' && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => onEdit(item)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                            >
                                <Settings size={14} className="rotate-90" /> {/* Reuse icon for edit or import Edit2 */}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('确定取消该报修申请吗？')) onDelete(item.id)
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="text-sm text-gray-500 mb-1">{item.description}</div>

            {/* Show images count or preview if needed, keeping simple matching existing UI */}

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
    const [editRepairId, setEditRepairId] = useState<string | null>(null) // New State
    const [repairTitle, setRepairTitle] = useState('')
    const [repairDesc, setRepairDesc] = useState('')
    const [repairImages, setRepairImages] = useState<File[]>([])
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<{ id: string, url: string }[]>([]) // Handle existing images for edit
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

    // 提交/更新报修
    const submitRepairMutation = useMutation({
        mutationFn: async (data: { title: string; description: string; imageUrls?: string[] }) => {
            if (editRepairId) {
                // Update
                await client.put(`/repair-requests/my/${editRepairId}`, data)
            } else {
                // Create
                await client.post('/repair-requests', data)
            }
        },
        onSuccess: () => {
            toast.success(editRepairId ? '报修已更新' : '报修提交成功')
            queryClient.invalidateQueries({ queryKey: ['my-repair-requests'] })
            handleCloseModal()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '提交失败')
        }
    })

    // 删除报修
    const deleteRepairMutation = useMutation({
        mutationFn: async (id: string) => {
            await client.delete(`/repair-requests/${id}`)
        },
        onSuccess: () => {
            toast.success('报修已取消')
            queryClient.invalidateQueries({ queryKey: ['my-repair-requests'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '删除失败')
        }
    })

    const handleCloseModal = () => {
        setIsRepairModalOpen(false)
        setEditRepairId(null)
        setRepairTitle('')
        setRepairDesc('')
        setRepairImages([])
        setImagePreviewUrls([])
        setExistingImages([])
    }

    const handleEditClick = (item: any) => {
        setEditRepairId(item.id)
        setRepairTitle(item.title)
        setRepairDesc(item.description)
        setExistingImages(item.images || [])
        // Existing images need to be handled carefully in UI and submission
        // For simplicity, we might just show them and allow adding more?
        // Or we convert them to previewUrls? No, previewUrls are local strings.
        // Let's separate existingImages display.

        setIsRepairModalOpen(true)
    }

    // 处理图片选择
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + repairImages.length > 5) {
            toast.error('最多上传5张图片')
            return
        }

        const compressedFiles: File[] = []
        const newPreviewUrls: string[] = []

        try {
            const options = {
                maxSizeMB: 1, // Max file size 1MB (much better than 5-10MB)
                maxWidthOrHeight: 1920, // Reasonable max resolution
                useWebWorker: true,
                initialQuality: 0.8 // Good balance of quality and size
            }

            for (const file of files) {
                // Compress if image
                if (file.type.startsWith('image/')) {
                    const compressedFile = await imageCompression(file, options)
                    compressedFiles.push(compressedFile)
                    // Create preview from compressed file to confirm it works
                    newPreviewUrls.push(URL.createObjectURL(compressedFile))
                } else {
                    compressedFiles.push(file)
                }
            }

            // 添加新图片
            setRepairImages(prev => [...prev, ...compressedFiles])
            setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])

        } catch (error) {
            console.error('Image compression failed:', error)
            toast.error('图片处理失败，请重试')
        }
    }



    const handleSubmitRepair = async () => {
        if (!repairTitle.trim()) {
            toast.error('请输入报修标题')
            return
        }

        try {
            setIsUploading(true)
            let imageUrls: string[] = []

            // 保留的旧图片 (Check logic: if we allow deleting existing images in UI, 
            // we should likely filter existingImages. For now let's assume all strictly filtered by UI state)
            imageUrls = existingImages.map(img => img.url)

            // 上传新图片
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

            // 提交
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

    // 移除图片 (支持移除新上传的 和 已存在的)
    const handleRemoveImage = (index: number, isExisting: boolean = false) => {
        if (isExisting) {
            setExistingImages(prev => prev.filter((_, i) => i !== index))
        } else {
            setRepairImages(prev => prev.filter((_, i) => i !== index))
            setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
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
                onClick={() => {
                    handleCloseModal() // Ensure clear state
                    setIsRepairModalOpen(true)
                }}
                className="w-full mb-6 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
            >
                <Wrench size={18} /> 提交报修
            </button>

            {/* 我的报修 */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">我的报修</h3>
                {repairRequests?.length > 0 ? (
                    repairRequests.map((req: any) => (
                        <RepairRequestCard
                            key={req.id}
                            item={req}
                            onEdit={handleEditClick}
                            onDelete={(id) => deleteRepairMutation.mutate(id)}
                        />
                    ))
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
            <Dialog open={isRepairModalOpen} onClose={handleCloseModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Wrench size={20} /> {editRepairId ? '编辑报修' : '提交报修'}
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
                                    {/* Existing Images */}
                                    {existingImages.map((img, index) => (
                                        <div key={`exist-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index, true)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* New Images */}
                                    {imagePreviewUrls.map((url, index) => (
                                        <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index, false)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                                            >
                                                <X size={12} className="text-white" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* 添加图片按钮 */}
                                    {existingImages.length + repairImages.length < 5 && (
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
                                {isUploading ? '上传图片中...' : submitRepairMutation.isPending ? '提交中...' : (editRepairId ? '保存修改' : '提交报修')}
                            </button>

                            <button
                                onClick={handleCloseModal}
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
