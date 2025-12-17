"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementRoutes = announcementRoutes;
exports.moveOutRoutes = moveOutRoutes;
const announcementService_js_1 = require("../services/announcementService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
async function announcementRoutes(fastify) {
    // ============ 公告 ============
    // 获取公告列表
    fastify.get('/', {
        preHandler: [auth_js_1.authenticate]
    }, async (request, reply) => {
        const result = await announcementService_js_1.announcementService.getAnnouncements(request.query);
        reply.send({ success: true, data: result });
    });
    // 发布公告 (管理员)
    fastify.post('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await announcementService_js_1.announcementService.createAnnouncement(request.body);
        reply.send({ success: true, data: result });
    });
    // 删除公告 (管理员)
    fastify.delete('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await announcementService_js_1.announcementService.deleteAnnouncement(id);
        reply.send({ success: true, data: result });
    });
    // 更新公告 (管理员)
    fastify.put('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await announcementService_js_1.announcementService.updateAnnouncement(id, request.body);
        reply.send({ success: true, data: result });
    });
}
async function moveOutRoutes(fastify) {
    // ============ 退租申请 ============
    // 获取申请列表 (管理员)
    fastify.get('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await announcementService_js_1.moveOutService.getRequests(request.query);
        reply.send({ success: true, data: result });
    });
    // 获取自己的申请 (租客)
    fastify.get('/my', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('tenant')]
    }, async (request, reply) => {
        const result = await announcementService_js_1.moveOutService.getMyRequests(request.user.sub);
        reply.send({ success: true, data: result });
    });
    // 提交申请 (租客)
    fastify.post('/', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('tenant')]
    }, async (request, reply) => {
        const result = await announcementService_js_1.moveOutService.createRequest(request.user.sub, request.body);
        reply.send({ success: true, data: result });
    });
    // 审批申请 (管理员)
    fastify.put('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await announcementService_js_1.moveOutService.processRequest(id, request.body);
        reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=announcements.js.map