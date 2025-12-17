import React from 'react'
import { Room } from '../types'
import { MapPin, Home, Info } from 'lucide-react'

interface RoomCardProps {
    room: Room
    onClick?: () => void
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
    // 获取封面图，如果没有则使用占位图
    const coverImage = room.images?.[0]?.url
        ? room.images[0].url
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'

    return (
        <div
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md transition-shadow active:scale-95 transition-transform duration-200"
            onClick={onClick}
        >
            <div className="relative aspect-[4/3] w-full">
                <img
                    src={coverImage}
                    alt={`Room ${room.roomNumber}`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-primary-700">
                    {room.status === 'vacant' ? '空置' : '已租'}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                        {room.roomNumber} 室
                    </h3>
                    <div className="text-right">
                        <span className="text-xl font-bold text-primary-600">¥{room.rent}</span>
                        <span className="text-xs text-gray-500">/月</span>
                    </div>
                </div>

                <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>押金: ¥{room.deposit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Home size={14} />
                        <span>{room.appliances?.length || 0} 件家电配套</span>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                    {room.appliances?.slice(0, 3).map((app) => (
                        <span
                            key={app.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                            {app.name}
                        </span>
                    ))}
                    {(room.appliances?.length || 0) > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            +{room.appliances.length - 3}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RoomCard
