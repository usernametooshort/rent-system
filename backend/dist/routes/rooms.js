"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomRoutes = roomRoutes;
const roomService_js_1 = require("../services/roomService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
const resourceOwner_js_1 = require("../middlewares/resourceOwner.js");
async function roomRoutes(fastify) {
    // 获取房屋列表 (游客/租客/管理员)
    fastify.get('/', {
        preHandler: [auth_js_1.optionalAuthenticate]
    }, async (request, reply) => {
        // 根据角色自动过滤
        const query = request.query;
        const role = request.user?.role || 'guest';
        const userId = request.user?.sub;
        // 游客只能看空置
        if (role === 'guest') {
            query.status = 'vacant';
        }
        // 租客逻辑可以由前端过滤，但为了安全，可以在 Service 层加过滤，或者这里处理
        // 这里简单处理：API 返回全量符合条件的，敏感字段已在 Service 中过滤
        // 如果是租客，查看自己的房间通过 /my-room 接口或者 id 接口
        // 列表接口通常用于浏览空置房（找新房？）
        // 假设租客也能看其他空置房
        if (role === 'tenant') {
            // 租客也能看空置房
        }
        const result = await roomService_js_1.roomService.getRooms(query);
        reply.send({ success: true, data: result });
    });
    // 获取房屋详情
    fastify.get('/:id', {
        preHandler: [auth_js_1.authenticate, (0, rbac_js_1.requireRole)('admin', 'tenant'), resourceOwner_js_1.checkRoomOwnership]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await roomService_js_1.roomService.getRoomById(id);
        reply.send({ success: true, data: result });
    });
    // 创建房屋 (管理员)
    fastify.post('/', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await roomService_js_1.roomService.createRoom(request.body);
        reply.send({ success: true, data: result });
    });
    // 更新房屋 (管理员)
    fastify.put('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await roomService_js_1.roomService.updateRoom(id, request.body);
        reply.send({ success: true, data: result });
    });
    // 删除房屋 (管理员)
    fastify.delete('/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await roomService_js_1.roomService.deleteRoom(id);
        reply.send({ success: true, data: result });
    });
    // 添加家电
    fastify.post('/:id/appliances', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const result = await roomService_js_1.roomService.addAppliance(id, request.body);
        reply.send({ success: true, data: result });
    });
    // 删除家电
    fastify.delete('/:id/appliances/:appId', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id, appId } = request.params;
        const result = await roomService_js_1.roomService.deleteAppliance(id, appId);
        reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=rooms.js.map