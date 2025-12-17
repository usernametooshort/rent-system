import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'

interface RoomFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any // 如果是编辑模式
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialData || {
            roomNumber: '',
            rent: '',
            deposit: ''
        }
    })

    // 重置表单当 model 打开/关闭或数据变化时
    // 简单起见，这里依赖 key 刷新或者手动 reset，但在 unmounted 时 react-hook-form 会自动处理

    const onSubmit = async (data: any) => {
        try {
            // 转换数字
            const payload = {
                ...data,
                rent: Number(data.rent),
                deposit: Number(data.deposit)
            }

            if (initialData?.id) {
                await client.put(`/rooms/${initialData.id}`, payload)
                toast.success('更新成功')
            } else {
                await client.post('/rooms', payload)
                toast.success('创建成功')
            }

            reset()
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || '操作失败')
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
                        {initialData ? '编辑房源' : '新增房源'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">房间号</label>
                            <input
                                {...register('roomNumber', { required: '必填' })}
                                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="例如: 101"
                            />
                            {errors.roomNumber && <span className="text-xs text-red-500">{errors.roomNumber.message as string}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">租金 (月)</label>
                                <input
                                    type="number"
                                    {...register('rent', { required: '必填' })}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="¥"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">押金</label>
                                <input
                                    type="number"
                                    {...register('deposit', { required: '必填' })}
                                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="¥"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 mt-4"
                        >
                            {isSubmitting ? '保存中...' : '保存'}
                        </button>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default RoomFormModal
