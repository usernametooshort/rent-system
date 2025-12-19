import { FastifyInstance } from 'fastify'
import { roomService } from '../services/roomService.js'
import { authenticate, optionalAuthenticate } from '../middlewares/auth.js'
import { adminOnly, requireRole } from '../middlewares/rbac.js'
import { checkRoomOwnership } from '../middlewares/resourceOwner.js'

export async function roomRoutes(fastify: FastifyInstance) {
    // 获取房屋列表 (游客/租客/管理员)
    fastify.get('/', {
        preHandler: [optionalAuthenticate]
    }, async (request, reply) => {
        // 根据角色自动过滤
        const query = request.query as any
        const role = request.user?.role || 'guest'
        const userId = request.user?.sub

        // 游客只能看空置
        if (role === 'guest') {
            query.status = 'vacant'
        }
        // 租客逻辑可以由前端过滤，但为了安全，可以在 Service 层加过滤，或者这里处理
        // 这里简单处理：API 返回全量符合条件的，敏感字段已在 Service 中过滤

        // 如果是租客，查看自己的房间通过 /my-room 接口或者 id 接口
        // 列表接口通常用于浏览空置房（找新房？）
        // 假设租客也能看其他空置房
        if (role === 'tenant') {
            // 租客也能看空置房
        }

        const result = await roomService.getRooms(query)
        reply.send({ success: true, data: result })
    })

    // 获取房屋详情
    fastify.get('/:id', {
        preHandler: [authenticate, requireRole('admin', 'tenant'), checkRoomOwnership]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await roomService.getRoomById(id)
        reply.send({ success: true, data: result })
    })

    // 创建房屋 (管理员)
    fastify.post('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await roomService.createRoom(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 更新房屋 (管理员)
    fastify.put('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await roomService.updateRoom(id, request.body as any)
        reply.send({ success: true, data: result })
    })

    // 删除房屋 (管理员)
    fastify.delete('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await roomService.deleteRoom(id)
        reply.send({ success: true, data: result })
    })

    // 添加家电
    fastify.post('/:id/appliances', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await roomService.addAppliance(id, request.body as any)
        reply.send({ success: true, data: result })
    })

    // 删除家电
    fastify.delete('/:id/appliances/:appId', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id, appId } = request.params as { id: string; appId: string }
        const result = await roomService.deleteAppliance(id, appId)
        reply.send({ success: true, data: result })
    })

    /**
     * 获取房间历史记录 (管理员)
     */
    fastify.get('/:id/history', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await roomService.getRoomHistory(id)
        reply.send({ success: true, data: result })
    })
}
