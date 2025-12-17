import { FastifyInstance } from 'fastify'
import { statsService } from '../services/statsService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly } from '../middlewares/rbac.js'

export async function statsRoutes(fastify: FastifyInstance) {
    // 租客缴费状态
    fastify.get('/rent-status', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await statsService.getRentStatus()
        reply.send({ success: true, data: result })
    })

    // 月度收入
    fastify.get('/income/monthly', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const result = await statsService.getMonthlyIncome()
        reply.send({ success: true, data: result })
    })
}
