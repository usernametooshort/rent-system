"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const authService_js_1 = require("../services/authService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
async function authRoutes(fastify) {
    // 管理员登录
    fastify.post('/admin-login', async (request, reply) => {
        const result = await authService_js_1.authService.adminLogin(request.body);
        reply.send({ success: true, data: result });
    });
    // 租客登录
    fastify.post('/tenant-login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        const result = await authService_js_1.authService.tenantLogin(request.body);
        reply.send({ success: true, data: result });
    });
    // 刷新 Token
    fastify.post('/refresh', async (request, reply) => {
        const result = await authService_js_1.authService.refreshToken(request.body);
        reply.send({ success: true, data: result });
    });
    // 登出 (客户端删除 token 即可，服务端可预留黑名单逻辑)
    fastify.post('/logout', {
        preHandler: [auth_js_1.authenticate]
    }, async (request, reply) => {
        reply.send({ success: true });
    });
    // 修改密码
    fastify.post('/change-password', {
        preHandler: [auth_js_1.authenticate]
    }, async (request, reply) => {
        const user = request.user;
        await authService_js_1.authService.changePassword(user.id, request.body, user.role);
        reply.send({ success: true });
    });
    // 创建管理员
    fastify.post('/admin/create', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await authService_js_1.authService.createAdmin(request.body);
        reply.send({ success: true, data: result });
    });
    // 更新管理员资料 (改名)
    fastify.put('/admin/profile', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const user = request.user;
        const result = await authService_js_1.authService.updateAdminProfile(user.id, request.body);
        reply.send({ success: true, data: result });
    });
    // 获取管理员列表
    fastify.get('/admin/list', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await authService_js_1.authService.getAdmins();
        reply.send({ success: true, data: result });
    });
    // 删除管理员
    fastify.delete('/admin/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const result = await authService_js_1.authService.deleteAdmin(id, user.id);
        reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=auth.js.map