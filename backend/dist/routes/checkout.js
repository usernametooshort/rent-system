"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutRoutes = checkoutRoutes;
const checkoutService_js_1 = require("../services/checkoutService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
async function checkoutRoutes(fastify) {
    // 处理退租 (仅管理员)
    fastify.post('/:roomId', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        try {
            const result = await checkoutService_js_1.checkoutService.processCheckout({
                roomId: request.params.roomId,
                ...request.body
            });
            return reply.send({
                success: true,
                data: result,
                message: '退租办理成功'
            });
        }
        catch (error) {
            return reply.status(400).send({
                success: false,
                error: { message: error.message }
            });
        }
    });
    // 获取退租记录列表 (仅管理员)
    fastify.get('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { page, limit } = request.query;
        const result = await checkoutService_js_1.checkoutService.getCheckoutRecords({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        });
        return reply.send({
            success: true,
            data: result
        });
    });
    // 获取单条退租记录 (仅管理员)
    fastify.get('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const record = await checkoutService_js_1.checkoutService.getCheckoutRecord(request.params.id);
        if (!record) {
            return reply.status(404).send({
                success: false,
                error: { message: '记录不存在' }
            });
        }
        return reply.send({
            success: true,
            data: record
        });
    });
}
//# sourceMappingURL=checkout.js.map