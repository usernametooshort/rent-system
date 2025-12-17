import React from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { Loader2, Phone } from 'lucide-react'

const AdminTenants: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-tenants'],
        queryFn: async () => {
            const res = await client.get('/tenants')
            return res.data.data.items
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
