"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantService = exports.TenantService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const errors_js_1 = require("../utils/errors.js");
class TenantService {
    /**
     * 获取租客列表
     */
    async getTenants(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const [tenants, total] = await Promise.all([
            prisma_js_1.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                include: {
                    room: true,
                    // 获取最近6条租金记录（包括已缴和未缴）
                    rentRecords: {
                        take: 6,
                        orderBy: { month: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_js_1.prisma.tenant.count({ where })
        ]);
        return {
            items: tenants,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * 获取租客详情
     */
    async getTenantById(id) {
        const tenant = await prisma_js_1.prisma.tenant.findUnique({
            where: { id },
            include: {
                room: true,
                rentRecords: {
                    orderBy: { month: 'desc' }
                },
                moveOutRequests: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!tenant)
            throw new errors_js_1.NotFoundError('租客不存在');
        return tenant;
    }
    /**
     * 创建租客（并绑定房间）
     */
    async createTenant(data) {
        // 1. 检查房间是否存在且空置
        const room = await prisma_js_1.prisma.room.findUnique({
            where: { id: data.roomId }
        });
        if (!room)
            throw new errors_js_1.NotFoundError('房间不存在');
        if (room.status === 'rented')
            throw new errors_js_1.ConflictError('该房间已出租');
        // 2. 检查手机号是否已存在
        const existingTenant = await prisma_js_1.prisma.tenant.findUnique({
            where: { phone: data.phone }
        });
        // 3. 事务操作：创建或更新租客 -> 更新房间状态
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            let tenant;
            if (existingTenant) {
                // 如果租客已存在
                if (existingTenant.status === 'active') {
                    throw new errors_js_1.ConflictError('该手机号已被注册且正在租房中');
                }
                // 如果是归档租客，进行"复活" (Re-renting)
                tenant = await tx.tenant.update({
                    where: { id: existingTenant.id },
                    data: {
                        name: data.name,
                        // phone 保持不变
                        // passwordHash 保持不变 (或者可以选择重置)
                        leaseStartDate: new Date(data.leaseStartDate),
                        leaseDurationMonths: data.leaseDurationMonths,
                        status: 'active',
                        checkOutDate: null, // 清除退租日期
                        updatedAt: new Date()
                    }
                });
            }
            else {
                // 创建新租客
                tenant = await tx.tenant.create({
                    data: {
                        id: data.phone, // 使用手机号作为ID
                        name: data.name,
                        phone: data.phone,
                        phoneLast6: data.phone.slice(-6),
                        leaseStartDate: new Date(data.leaseStartDate),
                        leaseDurationMonths: data.leaseDurationMonths,
                        status: 'active'
                    }
                });
            }
            // 更新房间状态并关联租客，如果有密码则一并更新
            const roomUpdateData = {
                status: 'rented',
                tenantId: tenant.id
            };
            if (data.wifiPassword !== undefined)
                roomUpdateData.wifiPassword = data.wifiPassword;
            if (data.lockPassword !== undefined)
                roomUpdateData.lockPassword = data.lockPassword;
            const updatedRoom = await tx.room.update({
                where: { id: data.roomId },
                data: roomUpdateData
            });
            return { tenant, room: updatedRoom };
        });
        return result;
    }
    /**
     * 更新租客信息
     */
    async updateTenant(id, data) {
        const tenant = await prisma_js_1.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new errors_js_1.NotFoundError('租客不存在');
        const updateData = { ...data };
        if (data.leaseStartDate) {
            updateData.leaseStartDate = new Date(data.leaseStartDate);
        }
        return prisma_js_1.prisma.tenant.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * 删除租客（解绑房屋）
     */
    async deleteTenant(id) {
        const tenant = await prisma_js_1.prisma.tenant.findUnique({
            where: { id },
            include: { room: true }
        });
        if (!tenant)
            throw new errors_js_1.NotFoundError('租客不存在');
        // 事务：更新房间状态 -> 删除租客
        await prisma_js_1.prisma.$transaction(async (tx) => {
            // 如果有绑定的房间，先释放
            if (tenant.room) {
                await tx.room.update({
                    where: { id: tenant.room.id },
                    data: {
                        status: 'vacant',
                        tenantId: null
                    }
                });
            }
            // 删除租客
            await tx.tenant.delete({ where: { id } });
        });
        return { success: true };
    }
    /**
     * 添加租金记录
     */
    async addRentRecord(tenantId, data) {
        const tenant = await prisma_js_1.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant)
            throw new errors_js_1.NotFoundError('租客不存在');
        // 检查当月记录是否已存在
        const existing = await prisma_js_1.prisma.rentRecord.findFirst({
            where: {
                tenantId,
                month: data.month
            }
        });
        if (existing) {
            throw new errors_js_1.ConflictError(`${data.month} 的账单已存在`);
        }
        return prisma_js_1.prisma.rentRecord.create({
            data: {
                ...data,
                tenantId
            }
        });
    }
    /**
     * 更新租金记录（缴费）
     */
    async updateRentRecord(recordId, data) {
        const record = await prisma_js_1.prisma.rentRecord.findUnique({ where: { id: recordId } });
        if (!record)
            throw new errors_js_1.NotFoundError('账单不存在');
        const updateData = { paid: data.paid };
        if (data.paid && data.paidAt) {
            updateData.paidAt = new Date(data.paidAt);
        }
        else if (data.paid) {
            updateData.paidAt = new Date(); // 默认当前时间
        }
        else {
            updateData.paidAt = null; // 标记未缴时清除时间
        }
        return prisma_js_1.prisma.rentRecord.update({
            where: { id: recordId },
            data: updateData
        });
    }
}
exports.TenantService = TenantService;
exports.tenantService = new TenantService();
//# sourceMappingURL=tenantService.js.map