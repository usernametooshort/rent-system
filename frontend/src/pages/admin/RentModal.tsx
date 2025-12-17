import React from 'react'
import { Dialog } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { X, Scan, Upload, Loader2, CreditCard } from 'lucide-react'
import { Room } from '../../types'
import imageCompression from 'browser-image-compression'
import Tesseract from 'tesseract.js'

interface RentModalProps {
    room: Room | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const RentModal: React.FC<RentModalProps> = ({ room, isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm()
    const [scanning, setScanning] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [idCardPreview, setIdCardPreview] = React.useState<string | null>(null)
    const [idCardUrl, setIdCardUrl] = React.useState<string | null>(null)

    if (!room) return null

    const onSubmit = async (data: any) => {
        try {
            // API expects: { name, phone, roomId, ... }
            // See tenantService.ts or tenants.ts route
            // POST /tenants with body
            await client.post('/tenants', {
                ...data,
                roomId: room.id,
                leaseDurationMonths: Number(data.leaseDurationMonths),
                idCardNumber: data.idCardNumber,
                idCardUrl: idCardUrl
            })

            toast.success('办理入住成功')
            reset()
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || '办理失败')
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm w-full relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400">
                        <X size={20} />
                    </button>

                    <Dialog.Title className="text-lg font-bold mb-6">
                        办理入住 - {room.roomNumber}室
                    </Dialog.Title>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* ID Card Scanning Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <CreditCard size={16} />
                                身份证扫描 (OCR)
                            </label>

                            <div className="flex gap-4 items-start">
                                {/* Upload / Preview Area */}
                                <div className="relative w-32 h-20 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 overflow-hidden shrink-0">
                                    {idCardPreview ? (
                                        <img src={idCardPreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Upload className="text-gray-400 mb-1" size={20} />
                                            <span className="text-[10px] text-gray-400">点击上传</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={scanning || uploading}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            // 1. Preview
                                            setIdCardPreview(URL.createObjectURL(file))
                                            setScanning(true)
                                            setUploading(true)
                                            setValue('idCardNumber', '识别中...')

                                            try {
                                                // 2. Compress
                                                const compressedFile = await imageCompression(file, {
                                                    maxSizeMB: 1,
                                                    maxWidthOrHeight: 1920,
                                                    initialQuality: 0.8
                                                })

                                                // 3. OCR (Parallel)
                                                // Note: langPath is default (CDN). In restricted network, might need local.
                                                // 'chi_sim' is Chinese Simplified
                                                const ocrPromise = Tesseract.recognize(
                                                    compressedFile,
                                                    'chi_sim',
                                                    {
                                                        logger: m => console.log(m)
                                                    }
                                                )

                                                // 4. Upload (Parallel)
                                                const formData = new FormData()
                                                formData.append('file', compressedFile)
                                                const uploadPromise = client.post('/upload/image', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                })

                                                const [ocrResult, uploadResult] = await Promise.all([ocrPromise, uploadPromise])

                                                // Handle Upload Result
                                                setIdCardUrl(uploadResult.data.data.url)

                                                // Handle OCR Result
                                                const text = ocrResult.data.text
                                                // Regex for ID Card (15 digit or 18 digit)
                                                // Simple regex to catch the continuous digit string
                                                const idMatch = text.match(/(?:\d{17}[\dXx]|\d{15})/)

                                                if (idMatch) {
                                                    setValue('idCardNumber', idMatch[0])
                                                    toast.success('识别成功')
                                                } else {
                                                    setValue('idCardNumber', '')
                                                    toast('未能自动识别号码，请手动输入', { icon: '⚠️' })
                                                }

                                            } catch (error) {
                                                console.error(error)
                                                toast.error('处理失败，请手动输入')
                                                setValue('idCardNumber', '')
                                            } finally {
                                                setScanning(false)
                                                setUploading(false)
                                            }
                                        }}
                                    />
                                </div>

                                {/* Status / Result Info */}
                                <div className="flex-1 space-y-2">
                                    {(scanning || uploading) && (
                                        <div className="text-xs text-primary-600 flex items-center gap-1">
                                            <Loader2 size={12} className="animate-spin" />
                                            {scanning ? '正在识别文字...' : '正在上传图片...'}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">身份证号</label>
                                        <input
                                            {...register('idCardNumber')}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono"
                                            placeholder="扫描后自动填入"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">租客姓名</label>
                            <input
                                {...register('name', { required: '必填' })}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name.message as string}</span>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">手机号</label>
                            <input
                                {...register('phone', { required: '必填', pattern: { value: /^1[3-9]\d{9}$/, message: '格式不正确' } })}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="作为登录账号"
                            />
                            {errors.phone && <span className="text-xs text-red-500">{errors.phone.message as string}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">起租日期</label>
                                <input
                                    type="date"
                                    {...register('leaseStartDate', { required: '必填' })}
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">租期 (月)</label>
                                <input
                                    type="number"
                                    {...register('leaseDurationMonths', { required: '必填', min: 1 })}
                                    defaultValue={12}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Wi-Fi 密码</label>
                                <input
                                    type="text"
                                    {...register('wifiPassword')}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="可选"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">门锁密码</label>
                                <input
                                    type="text"
                                    {...register('lockPassword')}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="可选"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 mt-4"
                        >
                            {isSubmitting ? '提交中...' : '确认入住'}
                        </button>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog >
    )
}

export default RentModal
