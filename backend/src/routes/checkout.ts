import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { checkoutService } from '../services/checkoutService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly } from '../middlewares/rbac.js'

interface CheckoutBody {
    depositRefunded: number
    deductions?: { name: string; amount: number }[]
    keyReturned: boolean
    applianceCheckResult?: { name: string; ok: boolean; note?: string }[]
    note?: string
}

export async function checkoutRoutes(fastify: FastifyInstance) {
    // 处理退租 (仅管理员)
    fastify.post<{ Params: { roomId: string }; Body: CheckoutBody }>('/:roomId', {
        preHandler: [authenticate, adminOnly]
    }, async (request: FastifyRequest<{ Params: { roomId: string }; Body: CheckoutBody }>, reply: FastifyReply) => {
        try {
            const result = await checkoutService.processCheckout({
                roomId: request.params.roomId,
                ...request.body
            })
            return reply.send({
                success: true,
                data: result,
                message: '退租办理成功'
            })
        } catch (error: any) {
            return reply.status(400).send({
                success: false,
                error: { message: error.message }
            })
        }
    })

    // 获取退租记录列表 (仅管理员)
    fastify.get('/', {
        preHandler: [authenticate, adminOnly]
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const { page, limit } = request.query as { page?: string; limit?: string }
        const result = await checkoutService.getCheckoutRecords({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        })
        return reply.send({
            success: true,
            data: result
        })
    })

    // 获取单条退租记录 (仅管理员)
    fastify.get<{ Params: { id: string } }>('/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const record = await checkoutService.getCheckoutRecord(request.params.id)
        if (!record) {
            return reply.status(404).send({
                success: false,
                error: { message: '记录不存在' }
            })
        }
        return reply.send({
            success: true,
            data: record
        })
    })
}
