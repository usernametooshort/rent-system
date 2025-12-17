"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = exports.RoomService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const errors_js_1 = require("../utils/errors.js");
class RoomService {
    /**
     * 获取房间列表
     */
    async getRooms(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const [rooms, total] = await Promise.all([
            prisma_js_1.prisma.room.findMany({
                where,
                skip,
                take: limit,
                include: {
                    appliances: true,
                    images: {
                        orderBy: { order: 'asc' }
                    },
                    // 仅返回 tenantId，不返回详细敏感信息
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            leaseStartDate: true
                        }
                    }
                },
                orderBy: { roomNumber: 'asc' }
            }),
            prisma_js_1.prisma.room.count({ where })
        ]);
        return {
            items: rooms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * 获取房间详情
     */
    async getRoomById(id) {
        const room = await prisma_js_1.prisma.room.findUnique({
            where: { id },
            include: {
                appliances: true,
                images: {
                    orderBy: { order: 'asc' }
                },
                tenant: {
                    include: {
                        rentRecords: {
                            orderBy: { month: 'desc' },
                            take: 12
                        }
                    }
                }
            }
        });
        if (!room) {
            throw new errors_js_1.NotFoundError('房间不存在');
        }
        return room;
    }
    /**
     * 创建房间
     */
    async createRoom(data) {
        // 检查房间号是否重复
        const existing = await prisma_js_1.prisma.room.findUnique({
            where: { roomNumber: data.roomNumber }
        });
        if (existing) {
            throw new errors_js_1.ConflictError(`房间号 ${data.roomNumber} 已存在`);
        }
        const room = await prisma_js_1.prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                rent: data.rent,
                deposit: data.deposit,
                status: 'vacant',
                appliances: {
                    create: data.appliances
                }
            },
            include: {
                appliances: true
            }
        });
        return room;
    }
    /**
     * 更新房间
     */
    async updateRoom(id, data) {
        const room = await prisma_js_1.prisma.room.findUnique({ where: { id } });
        if (!room) {
            throw new errors_js_1.NotFoundError('房间不存在');
        }
        // 如果修改房间号，检查是否冲突
        if (data.roomNumber && data.roomNumber !== room.roomNumber) {
            const existing = await prisma_js_1.prisma.room.findUnique({
                where: { roomNumber: data.roomNumber }
            });
            if (existing) {
                throw new errors_js_1.ConflictError(`房间号 ${data.roomNumber} 已存在`);
            }
        }
        return prisma_js_1.prisma.room.update({
            where: { id },
            data,
            include: { appliances: true, images: true }
        });
    }
    /**
     * 删除房间
     */
    async deleteRoom(id) {
        const room = await prisma_js_1.prisma.room.findUnique({
            where: { id },
            include: { tenant: true } // 检查是否有租客
        });
        if (!room) {
            throw new errors_js_1.NotFoundError('房间不存在');
        }
        if (room.status === 'rented' || room.tenant) {
            throw new errors_js_1.ValidationError('无法删除已出租的房间，请先解绑租客');
        }
        await prisma_js_1.prisma.room.delete({ where: { id } });
        return { id };
    }
    /**
     * 添加家电
     */
    async addAppliance(roomId, data) {
        const room = await prisma_js_1.prisma.room.findUnique({ where: { id: roomId } });
        if (!room)
            throw new errors_js_1.NotFoundError('房间不存在');
        return prisma_js_1.prisma.appliance.create({
            data: {
                ...data,
                roomId
            }
        });
    }
    /**
     * 删除家电
     */
    async deleteAppliance(roomId, applianceId) {
        const appliance = await prisma_js_1.prisma.appliance.findFirst({
            where: { id: applianceId, roomId }
        });
        if (!appliance)
            throw new errors_js_1.NotFoundError('家电不存在');
        await prisma_js_1.prisma.appliance.delete({ where: { id: applianceId } });
        return { id: applianceId };
    }
}
exports.RoomService = RoomService;
exports.roomService = new RoomService();
//# sourceMappingURL=roomService.js.map