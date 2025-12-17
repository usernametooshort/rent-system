import { prisma } from '../utils/prisma'

interface DeductionItem {
    name: string
    amount: number
}

interface ApplianceCheckItem {
    name: string
    ok: boolean
    note?: string
}

interface CheckoutInput {
    roomId: string
    depositRefunded: number
    deductions?: DeductionItem[]
    keyReturned: boolean
    applianceCheckResult?: ApplianceCheckItem[]
    note?: string
}

export class CheckoutService {
    /**
     * 处理退租
     * 1. 记录退租信息
     * 2. 删除租客
     * 3. 更新房间状态为空置
     */
    async processCheckout(input: CheckoutInput) {
        const { roomId, depositRefunded, deductions, keyReturned, applianceCheckResult, note } = input

        // 获取房间和租客信息
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { tenant: true }
        })

        if (!room) {
            throw new Error('房间不存在')
        }

        if (room.status !== 'rented' || !room.tenant) {
            throw new Error('该房间没有租客，无法办理退租')
        }

        const tenant = room.tenant
        const depositAmount = room.deposit

        // 使用事务处理退租
        const result = await prisma.$transaction(async (tx) => {
            // 1. 创建退租记录
            const checkoutRecord = await tx.checkoutRecord.create({
                data: {
                    depositAmount,
                    depositRefunded,
                    deductions: deductions ? JSON.stringify(deductions) : null,
                    keyReturned,
                    applianceCheckResult: applianceCheckResult ? JSON.stringify(applianceCheckResult) : null,
                    note,
                    tenantName: tenant.name,
                    tenantPhone: tenant.phone,
                    roomNumber: room.roomNumber
                }
            })

            // 2. 删除租客的所有租金记录
            await tx.rentRecord.deleteMany({
                where: { tenantId: tenant.id }
            })

            // 3. 删除租客的所有退租申请
            await tx.moveOutRequest.deleteMany({
                where: { tenantId: tenant.id }
            })

            // 4. 删除租客的所有报修申请（包括图片）
            await tx.repairImage.deleteMany({
                where: {
                    repair: {
                        tenantId: tenant.id
                    }
                }
            })
            await tx.repairRequest.deleteMany({
                where: { tenantId: tenant.id }
            })

            // 5. 删除租客
            await tx.tenant.delete({
                where: { id: tenant.id }
            })

            // 6. 更新房间状态
            await tx.room.update({
                where: { id: roomId },
                data: {
                    status: 'vacant',
                    tenantId: null
                }
            })

            return checkoutRecord
        })

        return result
    }

    /**
     * 获取所有退租记录
     */
    async getCheckoutRecords(query: { page?: number; limit?: number }) {
        const page = query.page || 1
        const limit = query.limit || 20
        const skip = (page - 1) * limit

        const [records, total] = await Promise.all([
            prisma.checkoutRecord.findMany({
                skip,
                take: limit,
                orderBy: { checkoutDate: 'desc' }
            }),
            prisma.checkoutRecord.count()
        ])

        // 解析 JSON 字段
        const parsedRecords = records.map(record => ({
            ...record,
            deductions: record.deductions ? JSON.parse(record.deductions) : [],
            applianceCheckResult: record.applianceCheckResult ? JSON.parse(record.applianceCheckResult) : []
        }))

        return {
            items: parsedRecords,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    /**
     * 获取单条退租记录
     */
    async getCheckoutRecord(id: string) {
        const record = await prisma.checkoutRecord.findUnique({
            where: { id }
        })

        if (!record) {
            return null
        }

        return {
            ...record,
            deductions: record.deductions ? JSON.parse(record.deductions) : [],
            applianceCheckResult: record.applianceCheckResult ? JSON.parse(record.applianceCheckResult) : []
        }
    }
}

export const checkoutService = new CheckoutService()
