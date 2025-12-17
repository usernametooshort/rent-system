import React, { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { toast } from 'react-hot-toast'
import { X, Plus, Trash2, Upload, Image as ImageIcon, Router, Lock } from 'lucide-react'
import { Room, Appliance } from '../../types'

interface RoomDetailEditModalProps {
    isOpen: boolean
    onClose: () => void
    roomId: string
}

const PRESET_APPLIANCES = [
    '空调', '洗衣机', '冰箱', '热水器', '电视', '微波炉',
    '床', '衣柜', '书桌', '椅子', '沙发', '餐桌'
]

const RoomDetailEditModal: React.FC<RoomDetailEditModalProps> = ({ isOpen, onClose, roomId }) => {
    const queryClient = useQueryClient()
    const [newAppliance, setNewAppliance] = useState({ name: '', compensationPrice: '' })
    const [uploading, setUploading] = useState(false)
    const [wifiPwd, setWifiPwd] = useState('')
    const [lockPwd, setLockPwd] = useState('')

    // 获取房间详情
    const { data: room, isLoading } = useQuery({
        queryKey: ['room', roomId],
        queryFn: async () => {
            const res = await client.get(`/rooms/${roomId}`)
            return res.data.data as Room
        },
        enabled: !!roomId && isOpen
    })

    // 初始化表单
    useEffect(() => {
        if (room) {
            setWifiPwd(room.wifiPassword || '')
            setLockPwd(room.lockPassword || '')
        }
    }, [room])

    // 更新信息 Mutation (Wifi/Lock)
    const updateRoomMutation = useMutation({
        mutationFn: async (data: any) => {
            await client.put(`/rooms/${roomId}`, data)
        },
        onSuccess: () => {
            toast.success('保存成功')
            queryClient.invalidateQueries({ queryKey: ['room', roomId] })
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '保存失败')
        }
    })

    // 添加家电
    const addApplianceMutation = useMutation({
        mutationFn: async (data: { name: string; compensationPrice: number }) => {
            const res = await client.post(`/rooms/${roomId}/appliances`, data)
            return res.data
        },
        onSuccess: () => {
            toast.success('添加成功')
            setNewAppliance({ name: '', compensationPrice: '' })
            queryClient.invalidateQueries({ queryKey: ['room', roomId] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '添加失败')
        }
    })

    // 删除家电
    const deleteApplianceMutation = useMutation({
        mutationFn: async (appId: string) => {
            await client.delete(`/rooms/${roomId}/appliances/${appId}`)
        },
        onSuccess: () => {
            toast.success('删除成功')
            queryClient.invalidateQueries({ queryKey: ['room', roomId] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '删除失败')
        }
    })

    // 上传图片
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            await client.post(`/upload/room-image?roomId=${roomId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('图片上传成功')
            queryClient.invalidateQueries({ queryKey: ['room', roomId] })
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || '上传失败')
        } finally {
            setUploading(false)
            e.target.value = '' // 清空 input
        }
    }

    // 删除图片
    const deleteImageMutation = useMutation({
        mutationFn: async (imageId: string) => {
            await client.delete(`/upload/room-image/${imageId}`)
        },
        onSuccess: () => {
            toast.success('图片删除成功')
            queryClient.invalidateQueries({ queryKey: ['room', roomId] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '删除失败')
        }
    })

    const handleAddAppliance = () => {
        if (!newAppliance.name.trim()) {
            toast.error('请输入家电名称')
            return
        }
        addApplianceMutation.mutate({
            name: newAppliance.name.trim(),
            compensationPrice: Number(newAppliance.compensationPrice) || 0
        })
    }

    const handlePresetClick = (preset: string) => {
        setNewAppliance(prev => ({ ...prev, name: preset }))
    }

    const handleSaveInfo = () => {
        updateRoomMutation.mutate({
            wifiPassword: wifiPwd,
            lockPassword: lockPwd
        })
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>

                    <Dialog.Title className="text-lg font-bold mb-4">
                        {isLoading ? '加载中...' : `房间 ${room?.roomNumber} - 配置管理`}
                    </Dialog.Title>

                    {isLoading || !room ? (
                        <div className="py-10 text-center">加载中...</div>
                    ) : (
                        <>
                            {/* 基本信息 & 智能设备密码 */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">租金</span>
                                        <span className="font-medium">¥{room.rent}/月</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">押金</span>
                                        <span className="font-medium">¥{room.deposit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">状态</span>
                                        <span className={`font-medium ${room.status === 'vacant' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {room.status === 'vacant' ? '空置' : '已租'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                            <Router size={16} />
                                            Wi-Fi 密码
                                        </label>
                                        <input
                                            type="text"
                                            value={wifiPwd}
                                            onChange={e => setWifiPwd(e.target.value)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                                            placeholder="输入Wi-Fi密码"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                            <Lock size={16} />
                                            智能门锁密码
                                        </label>
                                        <input
                                            type="text"
                                            value={lockPwd}
                                            onChange={e => setLockPwd(e.target.value)}
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                                            placeholder="输入门锁密码"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={handleSaveInfo}
                                            disabled={updateRoomMutation.isPending}
                                            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700 disabled:opacity-50"
                                        >
                                            {updateRoomMutation.isPending ? '保存中...' : '保存配置'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 家电/家具管理 */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <span>家电/家具配置</span>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                        {room.appliances?.length || 0} 项
                                    </span>
                                </h3>

                                {/* 预设选项 */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {PRESET_APPLIANCES.map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => handlePresetClick(preset)}
                                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>

                                {/* 添加表单 */}
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="名称"
                                        value={newAppliance.name}
                                        onChange={e => setNewAppliance(prev => ({ ...prev, name: e.target.value }))}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="赔偿金额"
                                        value={newAppliance.compensationPrice}
                                        onChange={e => setNewAppliance(prev => ({ ...prev, compensationPrice: e.target.value }))}
                                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={handleAddAppliance}
                                        disabled={addApplianceMutation.isPending}
                                        className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* 家电列表 */}
                                <div className="space-y-2">
                                    {room.appliances?.map((app: Appliance) => (
                                        <div key={app.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                                            <div>
                                                <span className="font-medium text-sm">{app.name}</span>
                                                {app.compensationPrice > 0 && (
                                                    <span className="text-xs text-orange-600 ml-2">
                                                        赔偿: ¥{app.compensationPrice}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`确定删除 ${app.name} 吗？`)) {
                                                        deleteApplianceMutation.mutate(app.id)
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!room.appliances || room.appliances.length === 0) && (
                                        <div className="text-center text-gray-400 text-sm py-4">
                                            暂无家电/家具
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 图片管理 */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                    <ImageIcon size={16} />
                                    <span>房屋图片</span>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                        {room.images?.length || 0} 张
                                    </span>
                                </h3>

                                {/* 上传按钮 */}
                                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors mb-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <Upload size={20} className="text-gray-400" />
                                    <span className="text-sm text-gray-500">
                                        {uploading ? '上传中...' : '点击上传图片'}
                                    </span>
                                </label>

                                {/* 图片列表 */}
                                <div className="grid grid-cols-3 gap-2">
                                    {room.images?.map((img: any) => (
                                        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={img.url}
                                                alt="房屋图片"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (confirm('确定删除这张图片吗？')) {
                                                        deleteImageMutation.mutate(img.id)
                                                    }
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {(!room.images || room.images.length === 0) && (
                                    <div className="text-center text-gray-400 text-sm py-4">
                                        暂无图片
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    关闭
                                </button>
                            </div>
                        </>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default RoomDetailEditModal
