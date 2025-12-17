import { FastifyInstance } from 'fastify'
import { authService } from '../services/authService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly } from '../middlewares/rbac.js'

export async function authRoutes(fastify: FastifyInstance) {
    // 管理员登录
    fastify.post('/admin-login', async (request, reply) => {
        const result = await authService.adminLogin(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 租客登录
    fastify.post('/tenant-login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        const result = await authService.tenantLogin(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 刷新 Token
    fastify.post('/refresh', async (request, reply) => {
        const result = await authService.refreshToken(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 登出 (客户端删除 token 即可，服务端可预留黑名单逻辑)
    fastify.post('/logout', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        reply.send({ success: true })
    })

    // 修改密码
    fastify.post('/change-password', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const user = (request as any).user
        await authService.changePassword(user.id, request.body as any, user.role)
        reply.send({ success: true })
    })

    // 创建管理员
    fastify.post('/admin/create', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await authService.createAdmin(request.body as any)
        reply.send({ success: true, data: result })
    })

    // 更新管理员资料 (改名)
    fastify.put('/admin/profile', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const user = (request as any).user
        const result = await authService.updateAdminProfile(user.id, request.body as any)
        reply.send({ success: true, data: result })
    })

    // 获取管理员列表
    fastify.get('/admin/list', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await authService.getAdmins()
        reply.send({ success: true, data: result })
    })

    // 删除管理员
    fastify.delete('/admin/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const user = (request as any).user
        const { id } = request.params as any
        const result = await authService.deleteAdmin(id, user.id)
        reply.send({ success: true, data: result })
    })
}
