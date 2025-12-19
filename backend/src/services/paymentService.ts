import { prisma } from '../utils/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import {
    UpdatePaymentSettingsInput,
    SubmitPaymentProofInput,
    ConfirmPaymentInput
} from '../schemas/payment.js'

export class PaymentService {
    /**
     * 获取付款设置（包含收款码）
     */
    async getPaymentSettings() {
        let settings = await prisma.paymentSettings.findUnique({
            where: { id: 'default' }
        })

        // 如果不存在则创建默认设置
        if (!settings) {
            settings = await prisma.paymentSettings.create({
                data: { id: 'default' }
            })
        }

        return settings
    }

    /**
     * 更新付款设置（管理员）
     */
    async updatePaymentSettings(data: UpdatePaymentSettingsInput) {
        return prisma.paymentSettings.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                ...data
            }
        })
    }

    /**
     * 租客提交付款凭证
     */
    async submitPaymentProof(recordId: string, tenantId: string, data: SubmitPaymentProofInput) {
        // 检查租金记录是否存在且属于该租客
        const record = await prisma.rentRecord.findUnique({
            where: { id: recordId }
        })

        if (!record) {
            throw new NotFoundError('租金记录不存在')
        }

        if (record.tenantId !== tenantId) {
            throw new ValidationError('无权操作此记录')
        }

        if (record.paid) {
            throw new ValidationError('该账单已确认付款')
        }

        // 更新记录
        return prisma.rentRecord.update({
            where: { id: recordId },
            data: {
                paymentProofUrl: data.paymentProofUrl,
                paymentStatus: 'pending',
                submittedAt: new Date()
            }
        })
    }

    /**
     * 管理员确认/拒绝付款
     */
    async confirmPayment(recordId: string, data: ConfirmPaymentInput) {
        const record = await prisma.rentRecord.findUnique({
            where: { id: recordId }
        })

        if (!record) {
            throw new NotFoundError('租金记录不存在')
        }

        if (record.paymentStatus !== 'pending') {
            throw new ValidationError('该记录不在待确认状态')
        }

        if (data.confirmed) {
            // 确认付款
            return prisma.rentRecord.update({
                where: { id: recordId },
                data: {
                    paid: true,
                    paidAt: new Date(),
                    paymentStatus: 'confirmed',
                    paymentNote: data.paymentNote
                }
            })
        } else {
            // 拒绝付款
            return prisma.rentRecord.update({
                where: { id: recordId },
                data: {
                    paymentStatus: 'rejected',
                    paymentNote: data.paymentNote
                }
            })
        }
    }

    /**
     * 获取待确认付款列表（管理员）
     */
    async getPendingPayments() {
        return prisma.rentRecord.findMany({
            where: {
                paymentStatus: 'pending'
            },
            include: {
                tenant: {
                    include: {
                        room: true
                    }
                }
            },
            orderBy: { submittedAt: 'asc' }
        })
    }

    /**
     * 获取待确认付款数量（用于角标）
     */
    async getPendingCount() {
        return prisma.rentRecord.count({
            where: {
                paymentStatus: 'pending'
            }
        })
    }

    /**
     * 获取租客的付款记录详情（包含凭证状态）
     */
    async getTenantPaymentRecords(tenantId: string) {
        return prisma.rentRecord.findMany({
            where: { tenantId },
            orderBy: { month: 'desc' },
            take: 12
        })
    }
}

export const paymentService = new PaymentService()
