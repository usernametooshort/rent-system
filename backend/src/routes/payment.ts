import { FastifyInstance } from 'fastify'
import { paymentService } from '../services/paymentService.js'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly, requireRole } from '../middlewares/rbac.js'
import {
    updatePaymentSettingsSchema,
    submitPaymentProofSchema,
    confirmPaymentSchema
} from '../schemas/payment.js'

export async function paymentRoutes(fastify: FastifyInstance) {
    // ============ 公开接口 ============

    /**
     * 获取付款设置（包含收款码）
     * 租客和访客都可访问
     */
    fastify.get('/settings', async (request, reply) => {
        const settings = await paymentService.getPaymentSettings()
        reply.send({ success: true, data: settings })
    })

    // ============ 租客接口 ============

    /**
     * 提交付款凭证
     */
    fastify.post('/submit/:recordId', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const { recordId } = request.params as { recordId: string }
        const body = submitPaymentProofSchema.parse(request.body)
        const result = await paymentService.submitPaymentProof(
            recordId,
            request.user!.sub,
            body
        )
        reply.send({ success: true, data: result })
    })

    /**
     * 获取自己的付款记录
     */
    fastify.get('/my-records', {
        preHandler: [authenticate, requireRole('tenant')]
    }, async (request, reply) => {
        const records = await paymentService.getTenantPaymentRecords(request.user!.sub)
        reply.send({ success: true, data: records })
    })

    // ============ 管理员接口 ============

    /**
     * 更新付款设置（收款码等）
     */
    fastify.put('/settings', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const body = updatePaymentSettingsSchema.parse(request.body)
        const result = await paymentService.updatePaymentSettings(body)
        reply.send({ success: true, data: result })
    })

    /**
     * 获取待确认付款列表
     */
    fastify.get('/pending', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const records = await paymentService.getPendingPayments()
        reply.send({ success: true, data: records })
    })

    /**
     * 获取待确认付款数量（角标用）
     */
    fastify.get('/pending-count', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const count = await paymentService.getPendingCount()
        reply.send({ success: true, data: { count } })
    })

    /**
     * 确认/拒绝付款
     */
    fastify.put('/confirm/:recordId', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { recordId } = request.params as { recordId: string }
        const body = confirmPaymentSchema.parse(request.body)
        const result = await paymentService.confirmPayment(recordId, body)
        reply.send({ success: true, data: result })
    })
}
