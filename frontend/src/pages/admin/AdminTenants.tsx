import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { Loader2, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'

const AdminTenants: React.FC = () => {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery({
        queryKey: ['admin-tenants'],
        queryFn: async () => {
            const res = await client.get('/tenants')
            return res.data.data.items
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => client.delete(`/tenants/${id}`),
        onSuccess: () => {
            toast.success('删除成功')
            queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '删除失败')
        }
    })

    // 暂时只做展示列表，添加/编辑逻辑与 Room 类似

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    return (
        <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {data?.map((tenant: any) => (
                        <div key={tenant.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{tenant.name}</h3>
                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <Phone size={14} />
                                        {tenant.phone}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-primary-600">
                                        {tenant.room?.roomNumber || '未绑定'} 室
                                    </div>
                                    {tenant.rentRecords?.[0] && !tenant.rentRecords[0].paid && (
                                        <div className="text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">
                                            逾期
                                        </div>
                                    )}
                                    {/* Added buttons below the existing info */}
                                    <div className="flex justify-end gap-3 mt-2">
                                        <button
                                            onClick={() => {
                                                const newPassword = prompt(`请输入租客 "${tenant.name}" 的新密码:`)
                                                if (newPassword) {
                                                    if (newPassword.length < 6) {
                                                        toast.error('密码至少6位')
                                                        return
                                                    }
                                                    client.post(`/tenants/${tenant.id}/reset-password`, { newPassword })
                                                        .then(() => toast.success('密码重置成功'))
                                                        .catch((err) => toast.error(err.response?.data?.message || '重置失败'))
                                                }
                                            }}
                                            className="text-primary-600 hover:text-primary-900 text-sm"
                                        >
                                            重置密码
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('确定要删除该租客吗？由于租客关联数据较多，建议先操作退租流程。')) {
                                                    deleteMutation.mutate(tenant.id)
                                                }
                                            }}
                                            className="text-red-400 hover:text-red-600 text-sm"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data?.length === 0 && (
                        <div className="p-8 text-center text-gray-400">暂无租客</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminTenants
