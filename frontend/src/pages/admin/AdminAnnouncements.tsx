import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { Loader2, Plus, Edit2, Trash2, Megaphone } from 'lucide-react'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface Announcement {
    id: string
    title: string
    content: string
    createdAt: string
}

const AdminAnnouncements: React.FC = () => {
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['admin-announcements'],
        queryFn: async () => {
            const res = await client.get('/announcements')
            return res.data.data.items as Announcement[]
        }
    })

    const createMutation = useMutation({
        mutationFn: async (data: { title: string; content: string }) => {
            await client.post('/announcements', data)
        },
        onSuccess: () => {
            toast.success('公告发布成功')
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
            closeModal()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '操作失败')
        }
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { title: string; content: string } }) => {
            await client.put(`/announcements/${id}`, data)
        },
        onSuccess: () => {
            toast.success('公告更新成功')
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
            closeModal()
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '操作失败')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await client.delete(`/announcements/${id}`)
        },
        onSuccess: () => {
            toast.success('公告已删除')
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error?.message || '删除失败')
        }
    })

    const openCreateModal = () => {
        setEditingAnnouncement(null)
        setTitle('')
        setContent('')
        setIsModalOpen(true)
    }

    const openEditModal = (announcement: Announcement) => {
        setEditingAnnouncement(announcement)
        setTitle(announcement.title)
        setContent(announcement.content)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingAnnouncement(null)
        setTitle('')
        setContent('')
    }

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            toast.error('请填写完整信息')
            return
        }

        const payload = { title: title.trim(), content: content.trim() }

        if (editingAnnouncement) {
            updateMutation.mutate({ id: editingAnnouncement.id, data: payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const handleDelete = (id: string) => {
        if (confirm('确定删除这条公告？')) {
            deleteMutation.mutate(id)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div>
            {/* 添加按钮 */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                    <Plus size={18} />
                    发布公告
                </button>
            </div>

            {/* 公告列表 */}
            <div className="space-y-3">
                {data?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Megaphone size={48} className="mx-auto mb-3 opacity-50" />
                        <p>暂无公告</p>
                    </div>
                ) : (
                    data?.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 新建/编辑弹窗 */}
            <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-md w-full">
                        <Dialog.Title className="text-lg font-bold mb-4">
                            {editingAnnouncement ? '编辑公告' : '发布公告'}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="公告标题"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={5}
                                    placeholder="公告内容..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    )
}

export default AdminAnnouncements
