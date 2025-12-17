import { prisma } from '../utils/prisma.js'

export class StatsService {
    /**
     * 获取租客缴费状态统计
     */
    async getRentStatus() {
        // 获取当月
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // 1. 获取所有在租租客
        // 1. 获取所有租客（包括已归档，只要当月有账单）
        const tenants = await prisma.tenant.findMany({
            where: {
                OR: [
                    { status: 'active' }, // 在租
                    {
                        // 或者已归档但有当月账单
                        status: 'moved_out',
                        rentRecords: {
                            some: { month: currentMonth }
                        }
                    }
                ]
            },
            include: {
                room: true,
                rentRecords: {
                    where: { month: currentMonth }
                }
            }
        })

        const unpaid = []
        const paid = []
        let totalExpected = 0
        let totalCollected = 0

        for (const t of tenants) {
            const record = t.rentRecords[0]
            // 如果有账单，以账单金额为准；如果没有则取房间租金（仅限 active）
            const amount = record ? record.amount : (t.room?.rent || 0)

            // 只有当月有应收金额（有账单 或 在租）时才计入总额
            if (amount > 0) {
                totalExpected += amount
            }
            if (record?.paid) {
                paid.push({
                    id: t.id,
                    name: t.name,
                    roomNumber: t.room?.roomNumber,
                    amount: record.amount,
                    paidAt: record.paidAt
                })
                totalCollected += record.amount
            } else {
                unpaid.push({
                    id: t.id,
                    name: t.name,
                    roomNumber: t.room?.roomNumber,
                    amount: amount // 使用计算出的金额
                })
            }
        }

        return {
            month: currentMonth,
            summary: {
                totalTenants: tenants.length,
                paidCount: paid.length,
                unpaidCount: unpaid.length,
                totalExpected,
                totalCollected,
                completionRate: tenants.length > 0 ? totalCollected / totalExpected : 0
            },
            unpaid,
            paid
        }
    }

    /**
     * 获取月度收入统计（最近12个月）
     */
    async getMonthlyIncome() {
        const end = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 11) // 过去12个月

        // 聚合查询
        const records = await prisma.rentRecord.groupBy({
            by: ['month'],
            where: {
                paid: true
            },
            _sum: {
                amount: true
            },
            orderBy: {
                month: 'asc'
            }
        })

        return records.map((r: any) => ({
            month: r.month,
            amount: r._sum.amount || 0
        }))
    }
}

export const statsService = new StatsService()
