"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsService = exports.StatsService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
class StatsService {
    /**
     * 获取租客缴费状态统计
     */
    async getRentStatus() {
        // 获取当月
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        // 1. 获取所有在租租客
        const tenants = await prisma_js_1.prisma.tenant.findMany({
            where: {
                room: { isNot: null } // 有房间的才算
            },
            include: {
                room: true,
                rentRecords: {
                    where: { month: currentMonth }
                }
            }
        });
        const unpaid = [];
        const paid = [];
        let totalExpected = 0;
        let totalCollected = 0;
        for (const t of tenants) {
            const roomRent = t.room?.rent || 0;
            totalExpected += roomRent;
            const record = t.rentRecords[0];
            if (record?.paid) {
                paid.push({
                    id: t.id,
                    name: t.name,
                    roomNumber: t.room?.roomNumber,
                    amount: record.amount,
                    paidAt: record.paidAt
                });
                totalCollected += record.amount;
            }
            else {
                unpaid.push({
                    id: t.id,
                    name: t.name,
                    roomNumber: t.room?.roomNumber,
                    amount: roomRent // 默认为房间租金
                });
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
        };
    }
    /**
     * 获取月度收入统计（最近12个月）
     */
    async getMonthlyIncome() {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 11); // 过去12个月
        // 聚合查询
        const records = await prisma_js_1.prisma.rentRecord.groupBy({
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
        });
        return records.map(r => ({
            month: r.month,
            amount: r._sum.amount || 0
        }));
    }
}
exports.StatsService = StatsService;
exports.statsService = new StatsService();
//# sourceMappingURL=statsService.js.map