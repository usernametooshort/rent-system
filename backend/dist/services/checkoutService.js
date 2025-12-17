"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutService = exports.CheckoutService = void 0;
const prisma_1 = require("../utils/prisma");
class CheckoutService {
    /**
     * 处理退租
     * 1. 记录退租信息
     * 2. 归档租客 (Soft Delete)
     * 3. 更新房间状态为空置
     */
    async processCheckout(input) {
        const { roomId, depositRefunded, deductions, keyReturned, applianceCheckResult, note } = input;
        // 获取房间和租客信息
        const room = await prisma_1.prisma.room.findUnique({
            where: { id: roomId },
            include: { tenant: true }
        });
        if (!room) {
            throw new Error('房间不存在');
        }
        if (room.status !== 'rented' || !room.tenant) {
            throw new Error('该房间没有租客，无法办理退租');
        }
        const tenant = room.tenant;
        const depositAmount = room.deposit;
        // 使用事务处理退租
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. 创建退租记录
            const checkoutRecord = await tx.checkoutRecord.create({
                data: {
                    depositAmount,
                    depositRefunded,
                    deductions: deductions ? JSON.stringify(deductions) : null,
                    keyReturned,
                    applianceCheckResult: applianceCheckResult ? JSON.stringify(applianceCheckResult) : null,
                    note,
                    tenantName: tenant.name,
                    tenantPhone: tenant.phone,
                    roomNumber: room.roomNumber
                }
            });
            // 2. 归档租客（而不是删除）
            await tx.tenant.update({
                where: { id: tenant.id },
                data: {
                    status: 'moved_out',
                    checkOutDate: new Date(),
                    // 解除与房间的关联
                    room: { disconnect: true }
                }
            });
            // 注意：不再删除 RentRecord, MoveOutRequest, RepairRequest
            // 它们将作为历史记录保留
            // 6. 更新房间状态
            await tx.room.update({
                where: { id: roomId },
                data: {
                    status: 'vacant',
                    tenantId: null
                }
            });
            return checkoutRecord;
        });
        return result;
    }
    /**
     * 获取所有退租记录
     */
    async getCheckoutRecords(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            prisma_1.prisma.checkoutRecord.findMany({
                skip,
                take: limit,
                orderBy: { checkoutDate: 'desc' }
            }),
            prisma_1.prisma.checkoutRecord.count()
        ]);
        // 解析 JSON 字段
        const parsedRecords = records.map(record => ({
            ...record,
            deductions: record.deductions ? JSON.parse(record.deductions) : [],
            applianceCheckResult: record.applianceCheckResult ? JSON.parse(record.applianceCheckResult) : []
        }));
        return {
            items: parsedRecords,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * 获取单条退租记录
     */
    async getCheckoutRecord(id) {
        const record = await prisma_1.prisma.checkoutRecord.findUnique({
            where: { id }
        });
        if (!record) {
            return null;
        }
        return {
            ...record,
            deductions: record.deductions ? JSON.parse(record.deductions) : [],
            applianceCheckResult: record.applianceCheckResult ? JSON.parse(record.applianceCheckResult) : []
        };
    }
}
exports.CheckoutService = CheckoutService;
exports.checkoutService = new CheckoutService();
//# sourceMappingURL=checkoutService.js.map