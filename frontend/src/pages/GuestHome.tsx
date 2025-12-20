import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { Room } from '../types'
import RoomCard from '../components/RoomCard'
import RoomDetailModal from '../components/RoomDetailModal'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const GuestHome: React.FC = () => {
    const navigate = useNavigate()
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['rooms', 'vacant'],
        queryFn: async () => {
            const res = await client.get('/rooms', { params: { status: 'vacant' } })
            return res.data.data
        }
    })

    // 临时：如果 API 返回结构是 { items: [] }
    const rooms: Room[] = data?.items || []

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                        <h1 className="text-xl font-black text-primary-600 tracking-tighter">My 租客宝</h1>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        登录
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 pt-20">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">空置房源</h2>
                    <p className="text-gray-500">找到您心仪的家</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onClick={() => setSelectedRoom(room)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <p>暂无空置房源</p>
                    </div>
                )}
            </main>

            {/* Modal */}
            <RoomDetailModal
                room={selectedRoom}
                isOpen={!!selectedRoom}
                onClose={() => setSelectedRoom(null)}
                showCompensation={false}
            />
        </div>
    )
}

export default GuestHome
