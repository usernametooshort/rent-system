"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairRoutes = repairRoutes;
const repairService_js_1 = require("../services/repairService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
async function repairRoutes(fastify) {
    // 获取报修列表 (管理员)
    fastify.get('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await repairService_js_1.repairService.getRequests(request.query);
        reply.send({ success: true, data: result });
    });
    // 获取自己的报修 (租客)
    fastify.get('/my', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('tenant')]
    }, async (request, reply) => {
        const result = await repairService_js_1.repairService.getMyRequests(request.user.sub);
        reply.send({ success: true, data: result });
    });
    // 提交报修 (租客)
    fastify.post('/', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('tenant')]
    }, async (request, reply) => {
        const result = await repairService_js_1.repairService.createRequest(request.user.sub, request.body);
        reply.send({ success: true, data: result });
    });
    // 处理报修 (管理员)
    fastify.put('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await repairService_js_1.repairService.processRequest(id, request.body);
        reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=repair.js.map