"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveOutService = exports.announcementService = exports.MoveOutService = exports.AnnouncementService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const errors_js_1 = require("../utils/errors.js");
class AnnouncementService {
    /**
     * 获取公告列表
     */
    async getAnnouncements(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_js_1.prisma.announcement.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_js_1.prisma.announcement.count()
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * 创建公告
     */
    async createAnnouncement(data) {
        return prisma_js_1.prisma.announcement.create({
            data
        });
    }
    /**
     * 删除公告
     */
    async deleteAnnouncement(id) {
        try {
            await prisma_js_1.prisma.announcement.delete({ where: { id } });
            return { success: true };
        }
        catch {
            throw new errors_js_1.NotFoundError('公告不存在');
        }
    }
    /**
     * 更新公告
     */
    async updateAnnouncement(id, data) {
        const existing = await prisma_js_1.prisma.announcement.findUnique({ where: { id } });
        if (!existing)
            throw new errors_js_1.NotFoundError('公告不存在');
        return prisma_js_1.prisma.announcement.update({
            where: { id },
            data
        });
    }
}
exports.AnnouncementService = AnnouncementService;
class MoveOutService {
    /**
     * 获取退租申请列表
     */
    async getRequests(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const [items, total] = await Promise.all([
            prisma_js_1.prisma.moveOutRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    tenant: {
                        include: { room: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_js_1.prisma.moveOutRequest.count({ where })
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    /**
     * 获取租客自己的申请
     */
    async getMyRequests(tenantId) {
        return prisma_js_1.prisma.moveOutRequest.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * 提交退租申请
     */
    async createRequest(tenantId, data) {
        // 检查是否有未处理的申请
        const pending = await prisma_js_1.prisma.moveOutRequest.findFirst({
            where: {
                tenantId,
                status: 'pending'
            }
        });
        if (pending) {
            throw new errors_js_1.ValidationError('您已有一个待处理的退租申请');
        }
        return prisma_js_1.prisma.moveOutRequest.create({
            data: {
                tenantId,
                preferredInspectionDate: new Date(data.preferredInspectionDate),
                status: 'pending'
            }
        });
    }
    /**
     * 审批退租申请
     */
    async processRequest(id, data) {
        const request = await prisma_js_1.prisma.moveOutRequest.findUnique({ where: { id } });
        if (!request)
            throw new errors_js_1.NotFoundError('申请不存在');
        if (request.status !== 'pending') {
            throw new errors_js_1.ValidationError('只能处理待审批的申请');
        }
        return prisma_js_1.prisma.moveOutRequest.update({
            where: { id },
            data: {
                status: data.status,
                note: data.note
            }
        });
    }
}
exports.MoveOutService = MoveOutService;
exports.announcementService = new AnnouncementService();
exports.moveOutService = new MoveOutService();
//# sourceMappingURL=announcementService.js.map