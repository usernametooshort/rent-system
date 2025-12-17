import React from 'react'
import { Dialog } from '@headlessui/react'
import { Room } from '../types'
import { X, CheckCircle } from 'lucide-react'
import { getImageUrl } from '../utils/url'

interface RoomDetailModalProps {
    room: Room | null
    isOpen: boolean
    onClose: () => void
}

const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, isOpen, onClose }) => {
    if (!room) return null

    const coverImage = room.images?.[0]?.url
        ? getImageUrl(room.images[0].url)
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="relative">
                        <img
                            src={coverImage}
                            alt={room.roomNumber}
                            className="w-full h-64 object-cover"
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <h2 className="text-2xl font-bold text-white">{room.roomNumber} 室</h2>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-primary-50 p-3 rounded-lg text-center">
                                <div className="text-sm text-gray-500">月租金</div>
                                <div className="text-xl font-bold text-primary-600">¥{room.rent}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-sm text-gray-500">押金</div>
                                <div className="text-xl font-bold text-gray-700">¥{room.deposit}</div>
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-3">家电配套</h3>
                        <div className="space-y-3 mb-8">
                            {room.appliances?.map(app => (
                                <div key={app.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-500" />
                                        {app.name}
                                    </span>
                                    <span className="text-xs text-gray-400">赔偿金 ¥{app.compensationPrice}</span>
                                </div>
                            ))}
                            {(!room.appliances || room.appliances.length === 0) && (
                                <div className="text-gray-400 text-sm">暂无配置家电</div>
                            )}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-400 mb-2">感兴趣？请联系管理员看房</p>
                            <a
                                href="tel:13800000000"
                                className="block w-full py-3 bg-primary-600 text-white rounded-lg font-semibold active:bg-primary-700 transition-colors"
                            >
                                拨打看房热线
                            </a>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}

export default RoomDetailModal
