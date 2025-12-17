import { FastifyInstance } from 'fastify'
import { authService } from '../services/authService.js'
import { authenticate } from '../middlewares/auth.js'

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
}
