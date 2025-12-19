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
     * 确认/拒绝付款
     */
    async confirmPayment(recordId: string, data: ConfirmPaymentInput) {
        const record = await prisma.rentRecord.findUnique({
            where: { id: recordId },
            include: { tenant: true }
        })

        if (!record) {
            throw new NotFoundError('租金记录不存在')
        }

        if (record.paymentStatus !== 'pending') {
            throw new ValidationError('该记录不在待确认状态')
        }

        if (data.confirmed) {
            // 确认付款
            const updatedRecord = await prisma.rentRecord.update({
                where: { id: recordId },
                data: {
                    paid: true,
                    paidAt: new Date(),
                    paymentStatus: 'confirmed',
                    paymentNote: data.paymentNote
                }
            })

            // 如果确认的是押金，同步更新租客状态
            if (record.type === 'DEPOSIT') {
                await prisma.tenant.update({
                    where: { id: record.tenantId },
                    data: { depositPaid: true }
                })
            }

            return updatedRecord
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
     * 自动生成缺失的租金账单（从起租月到当前月）
     */
    private async autoGenerateRentRecords(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { room: true }
        })

        if (!tenant || tenant.status !== 'active' || !tenant.room) return

        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1

        const leaseStart = new Date(tenant.leaseStartDate)
        let iterYear = leaseStart.getFullYear()
        let iterMonth = leaseStart.getMonth() + 1

        while (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonth)) {
            const monthStr = `${iterYear}-${String(iterMonth).padStart(2, '0')}`

            // 检查该月 RENT 类型账单是否存在
            const existing = await prisma.rentRecord.findUnique({
                where: {
                    tenantId_month_type: {
                        tenantId,
                        month: monthStr,
                        type: 'RENT'
                    }
                }
            })

            if (!existing) {
                await prisma.rentRecord.create({
                    data: {
                        tenantId,
                        month: monthStr,
                        type: 'RENT',
                        amount: tenant.room.rent,
                        paymentStatus: 'unpaid'
                    }
                })
            }

            // 月份递增
            iterMonth++
            if (iterMonth > 12) {
                iterMonth = 1
                iterYear++
            }
        }
    }

    /**
     * 获取租客的付款记录详情（包含凭证状态）
     * 访问时会自动触发补全缺失账单
     */
    async getTenantPaymentRecords(tenantId: string) {
        // 先检查并自动生成缺失账单
        await this.autoGenerateRentRecords(tenantId)

        return prisma.rentRecord.findMany({
            where: { tenantId },
            orderBy: { month: 'desc' },
            take: 24 // 增加展示条数
        })
    }
}

export const paymentService = new PaymentService()
