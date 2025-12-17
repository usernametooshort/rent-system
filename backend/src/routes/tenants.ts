import { FastifyInstance, FastifyRequest } from 'fastify'
import { tenantService } from '../services/tenantService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly, requireRole } from '../middlewares/rbac.js'
import { checkTenantOwnership } from '../middlewares/resourceOwner.js'

export async function tenantRoutes(fastify: FastifyInstance) {
    // 获取租客列表 (管理员)
    fastify.get('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await tenantService.getTenants(request.query as any)
        return reply.send({ success: true, data: result })
    })

    // 创建租客 (管理员)
    fastify.post('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await tenantService.createTenant(request.body as any)
        return reply.send({ success: true, data: result })
    })

    // 获取租客详情 (管理员或本人)
    fastify.get<{ Params: { id: string } }>('/:id', {
        preHandler: [authenticate, requireRole('admin', 'tenant'), checkTenantOwnership]
    }, async (request: any, reply) => {
        const result = await tenantService.getTenantById(request.params.id)
        return reply.send({ success: true, data: result })
    })

    // 更新租客信息 (管理员)
    fastify.put<{ Params: { id: string } }>('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request: any, reply) => {
        const result = await tenantService.updateTenant(request.params.id, request.body as any)
        return reply.send({ success: true, data: result })
    })

    // 删除租客 (管理员)
    fastify.delete<{ Params: { id: string } }>('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request: any, reply) => {
        const result = await tenantService.deleteTenant(request.params.id)
        return reply.send({ success: true, data: result })
    })

    // 添加租金记录 (管理员)
    fastify.post<{ Params: { id: string } }>('/:id/rent-records', {
        preHandler: [authenticate, adminOnly]
    }, async (request: any, reply) => {
        const result = await tenantService.addRentRecord(request.params.id, request.body as any)
        return reply.send({ success: true, data: result })
    })

    // 更新租金记录 (管理员 - 标记已缴)
    fastify.put<{ Params: { id: string, recordId: string } }>('/:id/rent-records/:recordId', {
        preHandler: [authenticate, adminOnly]
    }, async (request: any, reply) => {
        const result = await tenantService.updateRentRecord(request.params.recordId, request.body as any)
        return reply.send({ success: true, data: result })
    })
}
