import { FastifyInstance } from 'fastify'
import { announcementService, moveOutService } from '../services/announcementService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly, requireRole } from '../middlewares/rbac.js'

export async function announcementRoutes(fastify: FastifyInstance) {
    // ============ 公告 ============

    // 获取公告列表
    fastify.get('/', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const result = await announcementService.getAnnouncements(request.query as any)
        reply.send({ success: true, data: result })
    })

    // 发布公告 (管理员)
    fastify.post('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await announcementService.createAnnouncement(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 删除公告 (管理员)
    fastify.delete('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await announcementService.deleteAnnouncement(id)
        reply.send({ success: true, data: result })
    })

    // 更新公告 (管理员)
    fastify.put('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await announcementService.updateAnnouncement(id, request.body as any)
        reply.send({ success: true, data: result })
    })
}

export async function moveOutRoutes(fastify: FastifyInstance) {
    // ============ 退租申请 ============

    // 获取申请列表 (管理员)
    fastify.get('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await moveOutService.getRequests(request.query as any)
        reply.send({ success: true, data: result })
    })

    // 获取自己的申请 (租客)
    fastify.get('/my', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const result = await moveOutService.getMyRequests(request.user!.sub)
        reply.send({ success: true, data: result })
    })

    // 提交申请 (租客)
    fastify.post('/', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const result = await moveOutService.createRequest(request.user!.sub, request.body as any)
        reply.send({ success: true, data: result })
    })

    // 审批申请 (管理员)
    fastify.put('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await moveOutService.processRequest(id, request.body as any)
        reply.send({ success: true, data: result })
    })
}
