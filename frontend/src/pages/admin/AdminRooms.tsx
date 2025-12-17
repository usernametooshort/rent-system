import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { Plus, MoreHorizontal, Edit2, Trash2, Key, Settings, Home, Users, LogOut } from 'lucide-react'
import RoomFormModal from './RoomFormModal'
import RentModal from './RentModal'
import RoomDetailEditModal from './RoomDetailEditModal'
import CheckoutModal from './CheckoutModal'
import { toast } from 'react-hot-toast'
import { Room } from '../../types'

const AdminRooms: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRentModalOpen, setIsRentModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [detailRoom, setDetailRoom] = useState<Room | null>(null)
    const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const queryClient = useQueryClient()

    // 获取房源列表
    const { data, isLoading } = useQuery({
        queryKey: ['admin-rooms'],
        queryFn: async () => {
            const res = await client.get('/rooms', { params: { limit: 100 } })
            return res.data.data.items as Room[]
        }
    })

    // 删除房源
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await client.delete(`/rooms/${id}`)
        },
        onSuccess: () => {
            toast.success('删除成功')
            queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '删除失败')
        }
    })

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenuId(null)
        }
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [openMenuId])

    const handleEdit = (room: Room) => {
        setOpenMenuId(null)
        setEditingRoom(room)
        setIsModalOpen(true)
    }

    const handleAdd = () => {
        setEditingRoom(null)
        setIsModalOpen(true)
    }

    const handleRent = (room: Room) => {
        setOpenMenuId(null)
        setSelectedRoom(room)
        setIsRentModalOpen(true)
    }

    const handleDetail = (room: Room) => {
        setOpenMenuId(null)
        setDetailRoom(room)
        setIsDetailModalOpen(true)
    }

    const handleCheckout = (room: Room) => {
        setOpenMenuId(null)
        setCheckoutRoom(room)
        setIsCheckoutModalOpen(true)
    }

    const handleDelete = (room: Room) => {
        setOpenMenuId(null)
        if (confirm('确定删除该房源吗？此操作不可恢复。')) {
            deleteMutation.mutate(room.id)
        }
    }

    const toggleMenu = (roomId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpenMenuId(openMenuId === roomId ? null : roomId)
    }

    // 统计数据
    const vacantCount = data?.filter((r: Room) => r.status === 'vacant').length || 0
    const rentedCount = data?.filter((r: Room) => r.status === 'rented').length || 0

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">房源管理</h1>
                        <p className="text-sm text-gray-500 mt-1">管理您的所有房产信息</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        添加房源
                    </button>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <Home size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-700">{vacantCount}</div>
                                <div className="text-xs text-emerald-600 font-medium">空置房源</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-700">{rentedCount}</div>
                                <div className="text-xs text-blue-600 font-medium">已出租</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 房源列表 */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    </div>
                ) : data?.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Home size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">暂无房源</p>
                        <p className="text-gray-400 text-sm mt-1">点击上方按钮添加第一个房源</p>
                    </div>
                ) : (
                    data?.map((room: Room) => (
                        <div
                            key={room.id}
                            className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* 房间号 */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold text-gray-700">{room.roomNumber}</span>
                                    </div>

                                    {/* 房间信息 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{room.roomNumber}室</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${room.status === 'vacant'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {room.status === 'vacant' ? '空置' : '已租'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="font-medium text-gray-900">¥{room.rent.toLocaleString()}/月</span>
                                            <span className="text-gray-300">|</span>
                                            <span>押金 ¥{room.deposit.toLocaleString()}</span>
                                        </div>
                                        {room.tenant && (
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users size={12} className="text-blue-600" />
                                                </div>
                                                <span className="text-sm text-blue-600 font-medium">{room.tenant.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 操作菜单 - 简化版本 */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => toggleMenu(room.id, e)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all cursor-pointer"
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>

                                    {openMenuId === room.id && (
                                        <div
                                            className="absolute right-0 top-12 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-[100]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {room.status === 'vacant' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRent(room)}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <Key size={16} />
                                                    办理入住
                                                </button>
                                            )}
                                            {room.status === 'rented' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCheckout(room)}
                                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50"
                                                >
                                                    <LogOut size={16} />
                                                    办理退租
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDetail(room)}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Settings size={16} />
                                                房屋配置
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(room)}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Edit2 size={16} />
                                                编辑信息
                                            </button>
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(room)}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                                删除房源
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <RoomFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingRoom}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
                    setIsModalOpen(false)
                }}
            />

            <RentModal
                isOpen={isRentModalOpen}
                onClose={() => setIsRentModalOpen(false)}
                room={selectedRoom}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
                }}
            />

            {detailRoom && (
                <RoomDetailEditModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false)
                        queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
                    }}
                    roomId={detailRoom.id}
                />
            )}

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                room={checkoutRoom}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
                }}
            />
        </div>
    )
}

export default AdminRooms
