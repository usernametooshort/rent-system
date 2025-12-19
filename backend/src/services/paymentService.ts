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
    public async autoGenerateRentRecords(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { room: true }
        })

        if (!tenant || tenant.status !== 'active' || !tenant.room) return

        // 1. 优先检查并生成押金记录 (只需一条)
        // 押金记录应该在入驻时就存在，无论租期是否已正式开始
        const existingDeposit = await prisma.rentRecord.findFirst({
            where: {
                tenantId,
                type: 'DEPOSIT'
            }
        })

        const leaseStart = new Date(tenant.leaseStartDate)
        const startYear = leaseStart.getUTCFullYear()
        const startMonth = leaseStart.getUTCMonth() + 1
        const startMonthStr = `${startYear}-${String(startMonth).padStart(2, '0')}`

        if (!existingDeposit) {
            await prisma.rentRecord.create({
                data: {
                    tenantId,
                    month: startMonthStr,
                    type: 'DEPOSIT',
                    amount: tenant.room.deposit,
                    paymentStatus: 'unpaid'
                }
            })
        }

        // 2. 自动生成租金账单 (从起租月到当前月)
        const now = new Date()
        // 使用 UTC 获取当前年月，确保与数据库中解析出的 leaseStart 对齐
        const currentYear = now.getUTCFullYear()
        const currentMonth = now.getUTCMonth() + 1

        let iterYear = startYear
        let iterMonth = startMonth

        // 只有当当前日期已经到达或超过租赁起始日期时，才开始生成租金账单
        while (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonth)) {
            const monthStr = `${iterYear}-${String(iterMonth).padStart(2, '0')}`

            const existingRent = await prisma.rentRecord.findUnique({
                where: {
                    tenantId_month_type: {
                        tenantId,
                        month: monthStr,
                        type: 'RENT'
                    }
                }
            })

            if (!existingRent) {
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

    /**
     * 获取付款历史记录（管理员）
     */
    async getPaymentHistory() {
        return prisma.rentRecord.findMany({
            where: {
                paymentStatus: { in: ['confirmed', 'rejected'] }
            },
            include: {
                tenant: {
                    include: {
                        room: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' },
            take: 100
        })
    }
}

export const paymentService = new PaymentService()
