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
    type: 'RENT' | 'DEPOSIT'
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

    // 找到当月租金账单
    const currentRentRecord = records?.find(r => r.month === getCurrentMonth() && r.type === 'RENT')
    // 待确认的账单
    const pendingRecords = records?.filter(r => r.paymentStatus === 'pending') || []
    // 押金记录 (未缴)
    const pendingDeposit = records?.find(r => r.type === 'DEPOSIT' && !r.paid)

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
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-green-100">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={24} />
                        <span className="font-bold text-lg">微信扫码付款</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 flex justify-center">
                        <img
                            src={getImageUrl(settings.wechatQrCodeUrl)}
                            alt="微信收款码"
                            className="max-w-[180px] w-full"
                        />
                    </div>
                    {settings.paymentNote && (
                        <p className="mt-4 text-sm text-white/90 text-center font-medium">
                            {settings.paymentNote}
                        </p>
                    )}
                    <p className="mt-2 text-[10px] text-white/70 text-center">
                        长按保存图片 · 打开微信扫一扫
                    </p>
                </div>
            )}

            {/* 待缴纳押金提示 */}
            {pendingDeposit && (
                <div className="mb-6 bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between">
                            <h3 className="text-sm font-bold text-purple-900">待缴纳押金</h3>
                            <span className="text-sm font-bold text-purple-600">¥{pendingDeposit.amount}</span>
                        </div>
                        <p className="text-xs text-purple-700 mt-0.5">入住前请确保押金已缴纳并确认</p>
                        {pendingDeposit.paymentStatus === 'pending' ? (
                            <div className="mt-2 text-xs font-medium text-orange-600 flex items-center gap-1">
                                <Clock size={12} /> 凭证已提交，待确认
                            </div>
                        ) : (
                            <button
                                onClick={() => handleOpenPayment(pendingDeposit)}
                                className="mt-2 text-xs font-bold text-purple-800 underline"
                            >
                                立即缴纳 &rarr;
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 本月房租账单 */}
            {currentRentRecord && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">本月房租</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="text-2xl font-black text-gray-900 tracking-tight">¥{currentRentRecord.amount}</span>
                                <span className="text-gray-400 text-sm ml-2 font-medium">{currentRentRecord.month}</span>
                            </div>
                            {(() => {
                                const status = paymentStatusConfig[currentRentRecord.paymentStatus]
                                const Icon = status.icon
                                return (
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                        <Icon size={12} />
                                        {status.text}
                                    </span>
                                )
                            })()}
                        </div>

                        {currentRentRecord.paymentStatus === 'rejected' && currentRentRecord.paymentNote && (
                            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-100">
                                <AlertCircle size={14} className="inline mr-1 -mt-0.5" />
                                拒绝原因: {currentRentRecord.paymentNote}
                            </div>
                        )}

                        {(currentRentRecord.paymentStatus === 'unpaid' || currentRentRecord.paymentStatus === 'rejected') && (
                            <button
                                onClick={() => handleOpenPayment(currentRentRecord)}
                                className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-primary-100"
                            >
                                <Upload size={18} />
                                上传付款凭证
                            </button>
                        )}

                        {currentRentRecord.paymentStatus === 'pending' && (
                            <div className="bg-orange-50 text-center text-orange-600 text-xs font-bold py-3 rounded-xl border border-orange-100">
                                <Clock size={16} className="inline mr-1.5 -mt-0.5" />
                                凭证处理中，请耐心等待
                            </div>
                        )}

                        {currentRentRecord.paymentStatus === 'confirmed' && (
                            <div className="bg-green-50 text-center text-green-600 text-xs font-bold py-3 rounded-xl border border-green-100">
                                <Check size={16} className="inline mr-1.5 -mt-0.5" />
                                付款已确认 {currentRentRecord.paidAt && `(${format(new Date(currentRentRecord.paidAt), 'MM-dd HH:mm')})`}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 待确认列表 */}
            {pendingRecords.filter(r => r.id !== currentRentRecord?.id && r.id !== pendingDeposit?.id).length > 0 && (
                <div className="mb-8">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">其他待确认</h3>
                    <div className="space-y-3">
                        {pendingRecords.filter(r => r.id !== currentRentRecord?.id && r.id !== pendingDeposit?.id).map(record => (
                            <div key={record.id} className="bg-white rounded-xl p-4 flex justify-between items-center border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${record.type === 'DEPOSIT' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-gray-900">{record.type === 'DEPOSIT' ? '押金记录' : record.month}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">¥{record.amount}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                                    待确认
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 账单记录 */}
            <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">账单历史</h3>
                <div className="space-y-3">
                    {records?.filter(r => r.id !== currentRentRecord?.id && r.id !== pendingDeposit?.id && r.paymentStatus !== 'pending').map(record => {
                        const status = paymentStatusConfig[record.paymentStatus]
                        const Icon = status.icon
                        return (
                            <div key={record.id} className="bg-white rounded-xl p-4 flex justify-between items-center border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${record.type === 'DEPOSIT' ? 'bg-purple-100/10 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-gray-900">{record.type === 'DEPOSIT' ? '合同押金' : record.month}</span>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded leading-none ${record.type === 'DEPOSIT' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {record.type === 'DEPOSIT' ? '押金' : '房租'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium tracking-tight">¥{record.amount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                        <Icon size={12} />
                                        {record.paid ? '已缴' : status.text}
                                    </span>
                                    {!record.paid && record.paymentStatus !== 'pending' && (
                                        <button
                                            onClick={() => handleOpenPayment(record)}
                                            className="text-[10px] font-bold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 active:scale-95 transition-all"
                                        >
                                            支付
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {(!records || records.length === 0 || (records.length === 1 && (currentRentRecord || pendingDeposit))) && (
                        <div className="text-center bg-gray-50 rounded-xl py-12 border border-dashed border-gray-200">
                            <CreditCard size={32} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-sm text-gray-400 font-medium">暂无更多账单记录</p>
                        </div>
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
                            上传{selectedRecord?.type === 'DEPOSIT' ? '押金' : '房租'}凭证
                        </Dialog.Title>

                        {selectedRecord && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">款项类型</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${selectedRecord.type === 'DEPOSIT' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                                        }`}>
                                        {selectedRecord.type === 'DEPOSIT' ? '合同押金' : '房租账单'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        {selectedRecord.type === 'DEPOSIT' ? '缴纳项' : '账单月份'}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {selectedRecord.type === 'DEPOSIT' ? '租房押金' : selectedRecord.month}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">应付金额</span>
                                    <span className="text-xl font-black text-primary-600 tracking-tighter">¥{selectedRecord.amount}</span>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                上传微信支付截图
                            </label>

                            {previewUrl ? (
                                <div className="relative group">
                                    <img
                                        src={previewUrl}
                                        alt="付款截图"
                                        className="w-full rounded-2xl border-2 border-primary-100 object-cover aspect-[4/3]"
                                    />
                                    <button
                                        onClick={() => {
                                            setPreviewUrl(null)
                                            setUploadedUrl(null)
                                        }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-50 hover:bg-red-50 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                                            <Loader2 className="animate-spin text-primary-500 mb-2" size={32} />
                                            <span className="text-xs font-bold text-gray-500">正在处理图片...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50/30 transition-all group"
                                >
                                    <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-500 transition-colors mb-3">
                                        <Upload size={32} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">点击或拖拽上传</span>
                                    <span className="text-[10px] text-gray-400 mt-1 font-medium">支持 JPG, PNG · 最大 5MB</span>
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

                        <div className="space-y-3">
                            <button
                                onClick={handleSubmitProof}
                                disabled={!uploadedUrl || submitProofMutation.isPending}
                                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-100 transition-all active:scale-[0.98]"
                            >
                                {submitProofMutation.isPending ? '正在提交...' : '确认已付款'}
                            </button>

                            <button
                                onClick={handleCloseModal}
                                className="w-full text-gray-400 text-xs font-bold py-2 hover:text-gray-600 transition-colors"
                            >
                                取消并返回
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default TenantPayment
