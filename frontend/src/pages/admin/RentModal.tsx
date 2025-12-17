import React from 'react'
import { Dialog } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { Room } from '../../types'

interface RentModalProps {
    room: Room | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const RentModal: React.FC<RentModalProps> = ({ room, isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

    if (!room) return null

    const onSubmit = async (data: any) => {
        try {
            // API expects: { name, phone, roomId, ... }
            // See tenantService.ts or tenants.ts route
            // POST /tenants with body
            await client.post('/tenants', {
                ...data,
                roomId: room.id,
                leaseDurationMonths: Number(data.leaseDurationMonths)
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
        </Dialog>
    )
}

export default RentModal
