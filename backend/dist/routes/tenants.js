"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantRoutes = tenantRoutes;
const tenantService_js_1 = require("../services/tenantService.js");
const authService_js_1 = require("../services/authService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
const resourceOwner_js_1 = require("../middlewares/resourceOwner.js");
async function tenantRoutes(fastify) {
    // 获取租客列表 (管理员)
    fastify.get('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.getTenants(request.query);
        return reply.send({ success: true, data: result });
    });
    // 创建租客 (管理员)
    fastify.post('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.createTenant(request.body);
        return reply.send({ success: true, data: result });
    });
    // 获取租客详情 (管理员或本人)
    fastify.get('/:id', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('admin', 'tenant'), resourceOwner_js_1.checkTenantOwnership]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.getTenantById(request.params.id);
        return reply.send({ success: true, data: result });
    });
    // 更新租客信息 (管理员)
    fastify.put('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.updateTenant(request.params.id, request.body);
        return reply.send({ success: true, data: result });
    });
    // 删除租客 (管理员)
    fastify.delete('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.deleteTenant(request.params.id);
        return reply.send({ success: true, data: result });
    });
    // 重置租客密码 (管理员)
    fastify.post('/:id/reset-password', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await authService_js_1.authService.resetTenantPassword(request.params.id, request.body);
        return reply.send({ success: true, data: result });
    });
    // 添加租金记录 (管理员)
    fastify.post('/:id/rent-records', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.addRentRecord(request.params.id, request.body);
        return reply.send({ success: true, data: result });
    });
    // 更新租金记录 (管理员 - 标记已缴)
    fastify.put('/:id/rent-records/:recordId', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await tenantService_js_1.tenantService.updateRentRecord(request.params.recordId, request.body);
        return reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=tenants.js.map