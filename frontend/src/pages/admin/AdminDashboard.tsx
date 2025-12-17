import React from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { PieChart, TrendingUp, Users, Home } from 'lucide-react'
import { Loader2 } from 'lucide-react'

// 统计卡片组件
const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg ${color} text-white`}>
                <Icon size={20} />
            </div>
            <div className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">本月</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-xs text-gray-500">{title}</div>
        {subValue && <div className="text-xs text-green-600 mt-2 font-medium">{subValue}</div>}
    </div>
)

const AdminDashboard: React.FC = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // 并行请求多个统计接口
            const [incomeRes, statusRes] = await Promise.all([
                client.get('/stats/income/monthly'),
                client.get('/stats/rent-status')
            ])
            return {
                income: incomeRes.data.data,
                rentStatus: statusRes.data.data
            }
        }
    })

    if (isLoading) {
        return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-primary-500" /></div>
    }

    // 计算一些摘要数据
    const currentMonthIncome = stats?.income?.[stats.income.length - 1]?.amount || 0
    const totalTenants = stats?.rentStatus?.summary?.totalTenants || 0
    const paidCount = stats?.rentStatus?.summary?.paidCount || 0
    const completionRate = stats?.rentStatus?.summary?.completionRate || 0

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900">数据概览</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                    title="本月收入"
                    value={`¥${currentMonthIncome}`}
                    icon={TrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    title="收租率"
                    value={`${(completionRate * 100).toFixed(0)}%`}
                    subValue={`已缴 ${paidCount} / 总 ${totalTenants}`}
                    icon={PieChart}
                    color="bg-blue-500"
                />
                <StatCard
                    title="在租房源"
                    value={totalTenants}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title="空置房源"
                    value="-"
                    icon={Home}
                    color="bg-orange-500"
                />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <h3 className="font-bold text-gray-900 mb-4">欠费名单</h3>
                <div className="space-y-3">
                    {stats?.rentStatus?.unpaid?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                    {item.roomNumber}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-xs text-red-500">逾期未缴</div>
                                </div>
                            </div>
                            <div className="font-bold text-gray-900">¥{item.amount}</div>
                        </div>
                    ))}
                    {(!stats?.rentStatus?.unpaid?.length) && (
                        <div className="text-center text-gray-400 text-sm py-4">暂无欠费租客</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
