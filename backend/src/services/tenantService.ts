import { prisma } from '../utils/prisma.js'
import {
    ConflictError,
    NotFoundError,
    ValidationError
} from '../utils/errors.js'
import {
    CreateTenantInput,
    UpdateTenantInput,
    TenantQueryInput,
    RentRecordInput,
    UpdateRentRecordInput
} from '../schemas/tenant.js'
import { paymentService } from './paymentService.js'

export class TenantService {
    /**
     * 获取租客列表
     */
    async getTenants(query: TenantQueryInput) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status) {
            where.status = query.status
        }

        const [tenants, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                include: {
                    room: true,
                    // 获取最近6条租金记录（包括已缴和未缴）
                    rentRecords: {
                        take: 6,
                        orderBy: { month: 'desc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.tenant.count({ where })
        ])

        // 并发触发自动生成账单
        await Promise.all(
            tenants
                .filter(t => t.status === 'active')
                .map(t => paymentService.autoGenerateRentRecords(t.id))
        )

        return {
            items: tenants,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    /**
     * 获取租客详情
     */
    async getTenantById(id: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                room: true,
                rentRecords: {
                    orderBy: { month: 'desc' }
                },
                moveOutRequests: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!tenant) throw new NotFoundError('租客不存在')
        return tenant
    }

    /**
     * 创建租客（并绑定房间）
     */
    async createTenant(data: CreateTenantInput) {
        // 1. 检查房间是否存在且空置
        const room = await prisma.room.findUnique({
            where: { id: data.roomId }
        })

        if (!room) throw new NotFoundError('房间不存在')
        if (room.status === 'rented') throw new ConflictError('该房间已出租')

        // 2. 检查手机号是否已存在
        const existingTenant = await prisma.tenant.findUnique({
            where: { phone: data.phone }
        })

        // 3. 事务操作：创建或更新租客 -> 更新房间状态
        const result = await prisma.$transaction(async (tx) => {
            let tenant;

            if (existingTenant) {
                // 如果租客已存在
                if (existingTenant.status === 'active') {
                    throw new ConflictError('该手机号已被注册且正在租房中')
                }

                // 如果是归档租客，进行"复活" (Re-renting)
                tenant = await tx.tenant.update({
                    where: { id: existingTenant.id },
                    data: {
                        name: data.name,
                        // phone 保持不变
                        // passwordHash 保持不变 (或者可以选择重置)
                        leaseStartDate: new Date(data.leaseStartDate),
                        leaseDurationMonths: data.leaseDurationMonths,
                        status: 'active',
                        checkOutDate: null, // 清除退租日期
                        updatedAt: new Date()
                    }
                })
            } else {
                // 创建新租客
                tenant = await tx.tenant.create({
                    data: {
                        id: data.phone, // 使用手机号作为ID
                        name: data.name,
                        phone: data.phone,
                        phoneLast6: data.phone.slice(-6),
                        leaseStartDate: new Date(data.leaseStartDate),
                        leaseDurationMonths: data.leaseDurationMonths,
                        status: 'active'
                    }
                })
            }

            // 更新房间状态并关联租客，如果有密码则一并更新
            const roomUpdateData: any = {
                status: 'rented',
                tenantId: tenant.id
            }
            if (data.wifiPassword !== undefined) roomUpdateData.wifiPassword = data.wifiPassword
            if (data.lockPassword !== undefined) roomUpdateData.lockPassword = data.lockPassword

            const updatedRoom = await tx.room.update({
                where: { id: data.roomId },
                data: roomUpdateData
            })

            // 4. 自动生成押金记录
            await tx.rentRecord.create({
                data: {
                    tenantId: tenant.id,
                    month: new Date().toISOString().slice(0, 7), // 当前月份
                    type: 'DEPOSIT',
                    amount: updatedRoom.deposit,
                    paymentStatus: 'unpaid'
                }
            })

            return { tenant, room: updatedRoom }
        })

        return result
    }

    /**
     * 更新租客信息
     */
    async updateTenant(id: string, data: UpdateTenantInput) {
        const tenant = await prisma.tenant.findUnique({ where: { id } })
        if (!tenant) throw new NotFoundError('租客不存在')

        const updateData: any = { ...data }
        if (data.leaseStartDate) {
            updateData.leaseStartDate = new Date(data.leaseStartDate)
        }

        return prisma.tenant.update({
            where: { id },
            data: updateData
        })
    }

    /**
     * 删除租客（解绑房屋）
     */
    async deleteTenant(id: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: { room: true }
        })

        if (!tenant) throw new NotFoundError('租客不存在')

        // 事务：更新房间状态 -> 删除租客
        await prisma.$transaction(async (tx) => {
            // 如果有绑定的房间，先释放
            if (tenant.room) {
                await tx.room.update({
                    where: { id: tenant.room.id },
                    data: {
                        status: 'vacant',
                        tenantId: null
                    }
                })
            }

            // 删除租客
            await tx.tenant.delete({ where: { id } })
        })

        return { success: true }
    }

    /**
     * 添加租金记录
     */
    async addRentRecord(tenantId: string, data: RentRecordInput) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
        if (!tenant) throw new NotFoundError('租客不存在')

        // 检查当月同类型记录是否已存在
        const existing = await prisma.rentRecord.findFirst({
            where: {
                tenantId,
                month: data.month,
                type: (data as any).type || 'RENT'
            }
        })

        if (existing) {
            throw new ConflictError(`${data.month} 的账单已存在`)
        }

        return prisma.rentRecord.create({
            data: {
                ...data,
                tenantId
            }
        })
    }

    /**
     * 更新租金记录（缴费）
     */
    async updateRentRecord(recordId: string, data: UpdateRentRecordInput) {
        const record = await prisma.rentRecord.findUnique({ where: { id: recordId } })
        if (!record) throw new NotFoundError('账单不存在')

        const updateData: any = { paid: data.paid }
        if (data.paid && data.paidAt) {
            updateData.paidAt = new Date(data.paidAt)
        } else if (data.paid) {
            updateData.paidAt = new Date() // 默认当前时间
        } else {
            updateData.paidAt = null // 标记未缴时清除时间
        }

        return prisma.rentRecord.update({
            where: { id: recordId },
            data: updateData
        })
    }
}

export const tenantService = new TenantService()
