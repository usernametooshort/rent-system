"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairService = exports.RepairService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const errors_js_1 = require("../utils/errors.js");
class RepairService {
    /**
     * 获取报修列表 (管理员)
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
            prisma_js_1.prisma.repairRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    tenant: {
                        include: { room: true }
                    },
                    images: true // 包含图片
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma_js_1.prisma.repairRequest.count({ where })
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
     * 获取租客自己的报修
     */
    async getMyRequests(tenantId) {
        return prisma_js_1.prisma.repairRequest.findMany({
            where: { tenantId },
            include: { images: true }, // 包含图片
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * 提交报修（支持图片）
     */
    async createRequest(tenantId, data) {
        if (!data.title?.trim()) {
            throw new errors_js_1.ValidationError('报修标题不能为空');
        }
        // 使用事务创建报修和关联图片
        return prisma_js_1.prisma.$transaction(async (tx) => {
            // 创建报修请求
            const repair = await tx.repairRequest.create({
                data: {
                    tenantId,
                    title: data.title.trim(),
                    description: data.description?.trim() || '',
                    status: 'pending'
                }
            });
            // 如果有图片，创建图片记录
            if (data.imageUrls && data.imageUrls.length > 0) {
                await tx.repairImage.createMany({
                    data: data.imageUrls.map(url => ({
                        url,
                        repairId: repair.id
                    }))
                });
            }
            // 返回包含图片的完整记录
            return tx.repairRequest.findUnique({
                where: { id: repair.id },
                include: { images: true }
            });
        });
    }
    /**
     * 处理报修
     */
    async processRequest(id, data) {
        const request = await prisma_js_1.prisma.repairRequest.findUnique({ where: { id } });
        if (!request)
            throw new errors_js_1.NotFoundError('报修申请不存在');
        return prisma_js_1.prisma.repairRequest.update({
            where: { id },
            data: {
                status: data.status,
                note: data.note
            },
            include: { images: true }
        });
    }
}
exports.RepairService = RepairService;
exports.repairService = new RepairService();
//# sourceMappingURL=repairService.js.map