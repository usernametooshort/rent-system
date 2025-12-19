import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { format } from 'date-fns'
import { Loader2, Check, X, Clock, Eye, CreditCard, Upload, Image as ImageIcon } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import { getImageUrl } from '../../utils/url'

interface PendingPayment {
    id: string
    month: string
    amount: number
    type: 'RENT' | 'DEPOSIT'
    paymentProofUrl: string
    paymentStatus: string
    submittedAt: string
    tenant: {
        id: string
        name: string
        phone: string
        room?: {
            roomNumber: string
        }
    }
}

interface PaymentSettings {
    wechatQrCodeUrl?: string
    paymentNote?: string
}

const AdminPaymentConfirm: React.FC = () => {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [qrPreview, setQrPreview] = useState<string | null>(null)
    const [qrUrl, setQrUrl] = useState<string | null>(null)
    const [paymentNote, setPaymentNote] = useState('')
    const [rejectNote, setRejectNote] = useState('')

    // 获取待确认付款列表
    const { data: pendingPayments, isLoading: loadingPending } = useQuery<PendingPayment[]>({
        queryKey: ['pending-payments'],
        queryFn: async () => {
            const res = await client.get('/payment/pending')
            return res.data.data
        },
        refetchInterval: 30000 // 每30秒刷新
    })

    // 获取当前设置
    const { data: settings, isLoading: loadingSettings } = useQuery<PaymentSettings>({
        queryKey: ['payment-settings'],
        queryFn: async () => {
            const res = await client.get('/payment/settings')
            return res.data.data
        }
    })

    // 确认/拒绝付款
    const confirmMutation = useMutation({
        mutationFn: async ({ recordId, confirmed, note }: { recordId: string; confirmed: boolean; note?: string }) => {
            await client.put(`/payment/confirm/${recordId}`, { confirmed, paymentNote: note })
        },
        onSuccess: (_, variables) => {
            toast.success(variables.confirmed ? '付款已确认' : '付款已拒绝')
            queryClient.invalidateQueries({ queryKey: ['pending-payments'] })
            queryClient.invalidateQueries({ queryKey: ['admin-tenants-with-rent'] })
            setSelectedPayment(null)
            setIsPreviewOpen(false)
            setRejectNote('')
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '操作失败')
        }
    })

    // 更新设置
    const updateSettingsMutation = useMutation({
        mutationFn: async (data: { wechatQrCodeUrl?: string; paymentNote?: string }) => {
            await client.put('/payment/settings', data)
        },
        onSuccess: () => {
            toast.success('收款码设置已更新')
            queryClient.invalidateQueries({ queryKey: ['payment-settings'] })
            setIsSettingsOpen(false)
            setQrPreview(null)
            setQrUrl(null)
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '更新失败')
        }
    })

    // 上传收款码图片
    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)
            setQrPreview(URL.createObjectURL(compressedFile))

            const formData = new FormData()
            formData.append('file', compressedFile)
            const res = await client.post('/upload/image', formData)
            setQrUrl(res.data.data.url)
        } catch (err) {
            toast.error('上传失败')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate({
            wechatQrCodeUrl: qrUrl ?? settings?.wechatQrCodeUrl ?? undefined,
            paymentNote: paymentNote || (settings?.paymentNote ?? undefined)
        })
    }

    const openSettingsModal = () => {
        setPaymentNote(settings?.paymentNote || '')
        setQrPreview(null)
        setQrUrl(null)
        setIsSettingsOpen(true)
    }

    if (loadingPending || loadingSettings) {
        return (
            <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">付款确认</h2>
                <button
                    onClick={openSettingsModal}
                    className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                    <CreditCard size={16} />
                    收款码设置
                </button>
            </div>

            {/* 待确认列表 */}
            {pendingPayments && pendingPayments.length > 0 ? (
                <div className="space-y-3">
                    {pendingPayments.map(payment => (
                        <div key={payment.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded leading-none ${payment.type === 'DEPOSIT' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                                            }`}>
                                            {payment.type === 'DEPOSIT' ? '押金' : '房租'}
                                        </span>
                                        <span className="font-bold text-lg">{payment.tenant.room?.roomNumber || '未知'}室</span>
                                        <span className="text-gray-500">- {payment.tenant.name}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">{payment.tenant.phone}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-primary-600">¥{payment.amount}</div>
                                    <div className="text-sm text-gray-500">{payment.month}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 text-orange-600">
                                    <Clock size={16} />
                                    <span className="text-sm">
                                        提交于 {format(new Date(payment.submittedAt), 'MM-dd HH:mm')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedPayment(payment)
                                        setIsPreviewOpen(true)
                                    }}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                                >
                                    <Eye size={16} />
                                    查看凭证
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => confirmMutation.mutate({ recordId: payment.id, confirmed: true })}
                                    disabled={confirmMutation.isPending}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    <Check size={16} />
                                    确认付款
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPayment(payment)
                                        setIsPreviewOpen(true)
                                    }}
                                    disabled={confirmMutation.isPending}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    <X size={16} />
                                    拒绝
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <Check size={48} className="text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500">暂无待确认的付款</p>
                </div>
            )}

            {/* 凭证预览弹窗 */}
            <Dialog open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <Dialog.Title className="text-lg font-bold mb-4">
                            付款凭证 - {selectedPayment?.tenant.room?.roomNumber}室 {selectedPayment?.tenant.name}
                        </Dialog.Title>

                        {selectedPayment?.paymentProofUrl && (
                            <img
                                src={getImageUrl(selectedPayment.paymentProofUrl)}
                                alt="付款凭证"
                                className="w-full rounded-lg border border-gray-200 mb-4"
                            />
                        )}

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-600">账单月份</span>
                                <span className="font-medium">{selectedPayment?.month}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">应付金额</span>
                                <span className="font-bold text-primary-600">¥{selectedPayment?.amount}</span>
                            </div>
                        </div>

                        {/* 拒绝原因输入 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                拒绝原因（可选）
                            </label>
                            <input
                                type="text"
                                value={rejectNote}
                                onChange={e => setRejectNote(e.target.value)}
                                placeholder="如：截图模糊、金额不符等"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (selectedPayment) {
                                        confirmMutation.mutate({ recordId: selectedPayment.id, confirmed: true })
                                    }
                                }}
                                disabled={confirmMutation.isPending}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                                确认付款
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedPayment) {
                                        confirmMutation.mutate({
                                            recordId: selectedPayment.id,
                                            confirmed: false,
                                            note: rejectNote
                                        })
                                    }
                                }}
                                disabled={confirmMutation.isPending}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                拒绝
                            </button>
                        </div>

                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="w-full text-gray-500 text-sm py-2 mt-2"
                        >
                            取消
                        </button>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* 收款码设置弹窗 */}
            <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CreditCard size={20} />
                            收款码设置
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    微信收款码
                                </label>

                                {(qrPreview || settings?.wechatQrCodeUrl) ? (
                                    <div className="relative">
                                        <img
                                            src={qrPreview || getImageUrl(settings?.wechatQrCodeUrl || '')}
                                            alt="收款码"
                                            className="w-full rounded-lg border border-gray-200"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                        >
                                            更换图片
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
                                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50"
                                    >
                                        <ImageIcon size={32} className="text-gray-400 mb-2" />
                                        <span className="text-gray-500">上传微信收款码</span>
                                    </button>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrUpload}
                                    className="hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    付款说明（可选）
                                </label>
                                <input
                                    type="text"
                                    value={paymentNote}
                                    onChange={e => setPaymentNote(e.target.value)}
                                    placeholder="如：请备注房间号"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={updateSettingsMutation.isPending || isUploading}
                                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                                {updateSettingsMutation.isPending ? '保存中...' : '保存设置'}
                            </button>

                            <button
                                onClick={() => setIsSettingsOpen(false)}
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

export default AdminPaymentConfirm
