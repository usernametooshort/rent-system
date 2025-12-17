import { FastifyInstance } from 'fastify'
import { repairService } from '../services/repairService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly, requireRole } from '../middlewares/rbac.js'

export async function repairRoutes(fastify: FastifyInstance) {
    // 获取报修列表 (管理员)
    fastify.get('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await repairService.getRequests(request.query as any)
        reply.send({ success: true, data: result })
    })

    // 获取自己的报修 (租客)
    fastify.get('/my', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const result = await repairService.getMyRequests(request.user!.sub)
        reply.send({ success: true, data: result })
    })

    // 提交报修 (租客)
    fastify.post('/', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const result = await repairService.createRequest(request.user!.sub, request.body as any)
        reply.send({ success: true, data: result })
    })

    // 处理报修 (管理员)
    fastify.put('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }
        const result = await repairService.processRequest(id, request.body as any)
        reply.send({ success: true, data: result })
    })
}
