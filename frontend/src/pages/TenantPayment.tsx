import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { Loader2, CreditCard, Upload, Check, X, Clock, AlertCircle, ChevronLeft } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import { getImageUrl } from '../utils/url'
import { useNavigate } from 'react-router-dom'

interface RentRecord {
    id: string
    month: string
    amount: number
    paid: boolean
    paidAt?: string
    paymentProofUrl?: string
    paymentStatus: 'unpaid' | 'pending' | 'confirmed' | 'rejected'
    paymentNote?: string
    submittedAt?: string
}

interface PaymentSettings {
    wechatQrCodeUrl?: string
    paymentNote?: string
}

const paymentStatusConfig: Record<string, { text: string; color: string; icon: React.ElementType }> = {
    unpaid: { text: '待支付', color: 'text-gray-600 bg-gray-100', icon: CreditCard },
    pending: { text: '待确认', color: 'text-orange-600 bg-orange-100', icon: Clock },
    confirmed: { text: '已确认', color: 'text-green-600 bg-green-100', icon: Check },
    rejected: { text: '被拒绝', color: 'text-red-600 bg-red-100', icon: X }
}

const TenantPayment: React.FC = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedRecord, setSelectedRecord] = useState<RentRecord | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

    // 获取付款设置（收款码）
    const { data: settings, isLoading: loadingSettings } = useQuery<PaymentSettings>({
        queryKey: ['payment-settings'],
        queryFn: async () => {
            const res = await client.get('/payment/settings')
            return res.data.data
        }
    })

    // 获取我的付款记录
    const { data: records, isLoading: loadingRecords } = useQuery<RentRecord[]>({
        queryKey: ['my-payment-records'],
        queryFn: async () => {
            const res = await client.get('/payment/my-records')
            return res.data.data
        }
    })

    // 提交付款凭证
    const submitProofMutation = useMutation({
        mutationFn: async ({ recordId, paymentProofUrl }: { recordId: string; paymentProofUrl: string }) => {
            await client.post(`/payment/submit/${recordId}`, { paymentProofUrl })
        },
        onSuccess: () => {
            toast.success('付款凭证已提交，等待确认')
            queryClient.invalidateQueries({ queryKey: ['my-payment-records'] })
            handleCloseModal()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '提交失败')
        }
    })

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRecord(null)
        setPreviewUrl(null)
        setUploadedUrl(null)
    }

    const handleOpenPayment = (record: RentRecord) => {
        setSelectedRecord(record)
        setIsModalOpen(true)
    }

    // 处理图片选择
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)

            // 压缩图片
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8
            }
            const compressedFile = await imageCompression(file, options)

            // 预览
            setPreviewUrl(URL.createObjectURL(compressedFile))

            // 上传
            const formData = new FormData()
            formData.append('file', compressedFile)
            const res = await client.post('/upload/image', formData)
            setUploadedUrl(res.data.data.url)
            toast.success('图片上传成功')
        } catch (err: any) {
            toast.error('图片上传失败')
            setPreviewUrl(null)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmitProof = () => {
        if (!selectedRecord || !uploadedUrl) {
            toast.error('请先上传付款截图')
            return
        }
        submitProofMutation.mutate({
            recordId: selectedRecord.id,
            paymentProofUrl: uploadedUrl
        })
    }

    const getCurrentMonth = () => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    if (loadingSettings || loadingRecords) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-primary-500" />
            </div>
        )
    }

    // 找到当月账单
    const currentMonthRecord = records?.find(r => r.month === getCurrentMonth())
    // 未支付的账单
    const unpaidRecords = records?.filter(r => !r.paid && r.paymentStatus !== 'pending') || []
    // 待确认的账单
    const pendingRecords = records?.filter(r => r.paymentStatus === 'pending') || []

    return (
        <div>
            {/* 返回按钮 */}
            <button
                onClick={() => navigate('/tenant')}
                className="flex items-center text-gray-600 hover:text-primary-600 mb-4"
            >
                <ChevronLeft size={20} />
                <span>返回</span>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">缴费中心</h2>

            {/* 收款码卡片 */}
            {settings?.wechatQrCodeUrl && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 text-white">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={24} />
                        <span className="font-bold text-lg">微信扫码付款</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 flex justify-center">
                        <img
                            src={getImageUrl(settings.wechatQrCodeUrl)}
                            alt="微信收款码"
                            className="max-w-[200px] w-full"
                        />
                    </div>
                    {settings.paymentNote && (
                        <p className="mt-4 text-sm text-white/80 text-center">
                            {settings.paymentNote}
                        </p>
                    )}
                    <p className="mt-2 text-xs text-white/60 text-center">
                        长按保存图片 → 打开微信扫一扫
                    </p>
                </div>
            )}

            {!settings?.wechatQrCodeUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-yellow-800 font-medium">收款码未设置</p>
                        <p className="text-yellow-600 text-sm">请联系房东设置微信收款码</p>
                    </div>
                </div>
            )}

            {/* 当月账单 */}
            {currentMonthRecord && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">本月账单</h3>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <span className="text-2xl font-bold text-gray-900">¥{currentMonthRecord.amount}</span>
                                <span className="text-gray-500 ml-2">{currentMonthRecord.month}</span>
                            </div>
                            {(() => {
                                const status = paymentStatusConfig[currentMonthRecord.paymentStatus]
                                const Icon = status.icon
                                return (
                                    <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                        <Icon size={14} />
                                        {status.text}
                                    </span>
                                )
                            })()}
                        </div>

                        {currentMonthRecord.paymentStatus === 'rejected' && currentMonthRecord.paymentNote && (
                            <div className="bg-red-50 text-red-700 text-sm p-2 rounded mb-3">
                                拒绝原因: {currentMonthRecord.paymentNote}
                            </div>
                        )}

                        {(currentMonthRecord.paymentStatus === 'unpaid' || currentMonthRecord.paymentStatus === 'rejected') && (
                            <button
                                onClick={() => handleOpenPayment(currentMonthRecord)}
                                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
                            >
                                <Upload size={18} />
                                上传付款凭证
                            </button>
                        )}

                        {currentMonthRecord.paymentStatus === 'pending' && (
                            <div className="text-center text-orange-600 text-sm py-2">
                                <Clock size={16} className="inline mr-1" />
                                付款凭证已提交，等待房东确认
                            </div>
                        )}

                        {currentMonthRecord.paymentStatus === 'confirmed' && (
                            <div className="text-center text-green-600 text-sm py-2">
                                <Check size={16} className="inline mr-1" />
                                付款已确认 {currentMonthRecord.paidAt && `(${format(new Date(currentMonthRecord.paidAt), 'MM-dd HH:mm')})`}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 待确认列表 */}
            {pendingRecords.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">待确认</h3>
                    <div className="space-y-2">
                        {pendingRecords.map(record => (
                            <div key={record.id} className="bg-orange-50 rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-gray-900">{record.month}</span>
                                    <span className="text-gray-600 ml-2">¥{record.amount}</span>
                                </div>
                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                    <Clock size={12} className="inline mr-1" />待确认
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 历史账单 */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">历史账单</h3>
                <div className="space-y-2">
                    {records?.filter(r => r.month !== getCurrentMonth()).map(record => {
                        const status = paymentStatusConfig[record.paymentStatus]
                        const Icon = status.icon
                        return (
                            <div key={record.id} className="bg-white rounded-xl shadow-sm p-3 flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-gray-900">{record.month}</span>
                                    <span className="text-gray-600 ml-2">¥{record.amount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                        <Icon size={12} />
                                        {record.paid ? '已缴' : status.text}
                                    </span>
                                    {!record.paid && record.paymentStatus !== 'pending' && (
                                        <button
                                            onClick={() => handleOpenPayment(record)}
                                            className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                                        >
                                            缴费
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {(!records || records.length === 0) && (
                        <div className="text-center text-gray-400 py-8">暂无账单记录</div>
                    )}
                </div>
            </div>

            {/* 上传凭证弹窗 */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Upload size={20} />
                            上传付款凭证
                        </Dialog.Title>

                        {selectedRecord && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">账单月份</span>
                                    <span className="font-medium">{selectedRecord.month}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-gray-600">应付金额</span>
                                    <span className="font-bold text-lg text-primary-600">¥{selectedRecord.amount}</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                微信支付截图
                            </label>

                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="付款截图"
                                        className="w-full rounded-lg border border-gray-200"
                                    />
                                    <button
                                        onClick={() => {
                                            setPreviewUrl(null)
                                            setUploadedUrl(null)
                                        }}
                                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                                    >
                                        <X size={14} className="text-white" />
                                    </button>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                            <Loader2 className="animate-spin text-white" size={24} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                                >
                                    <Upload size={32} className="text-gray-400 mb-2" />
                                    <span className="text-gray-500">点击上传付款截图</span>
                                    <span className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</span>
                                </button>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        <button
                            onClick={handleSubmitProof}
                            disabled={!uploadedUrl || submitProofMutation.isPending}
                            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitProofMutation.isPending ? '提交中...' : '提交凭证'}
                        </button>

                        <button
                            onClick={handleCloseModal}
                            className="w-full text-gray-500 text-sm py-2 mt-2"
                        >
                            取消
                        </button>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default TenantPayment
