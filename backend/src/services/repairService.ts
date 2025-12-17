import { prisma } from '../utils/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

interface CreateRepairInput {
    title: string
    description: string
    imageUrls?: string[]  // 新增：图片URL列表
}

interface UpdateRepairInput {
    status: 'pending' | 'processing' | 'completed'
    note?: string
}

interface RepairQueryInput {
    page?: number
    limit?: number
    status?: string
}

export class RepairService {
    /**
     * 获取报修列表 (管理员)
     */
    async getRequests(query: RepairQueryInput) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status) {
            where.status = query.status
        }

        const [items, total] = await Promise.all([
            prisma.repairRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    tenant: {
                        include: { room: true }
                    },
                    images: true  // 包含图片
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.repairRequest.count({ where })
        ])

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    /**
     * 获取租客自己的报修
     */
    async getMyRequests(tenantId: string) {
        return prisma.repairRequest.findMany({
            where: { tenantId },
            include: { images: true },  // 包含图片
            orderBy: { createdAt: 'desc' }
        })
    }

    /**
     * 提交报修（支持图片）
     */
    async createRequest(tenantId: string, data: CreateRepairInput) {
        if (!data.title?.trim()) {
            throw new ValidationError('报修标题不能为空')
        }

        // 使用事务创建报修和关联图片
        return prisma.$transaction(async (tx) => {
            // 创建报修请求
            const repair = await tx.repairRequest.create({
                data: {
                    tenantId,
                    title: data.title.trim(),
                    description: data.description?.trim() || '',
                    status: 'pending'
                }
            })

            // 如果有图片，创建图片记录
            if (data.imageUrls && data.imageUrls.length > 0) {
                await tx.repairImage.createMany({
                    data: data.imageUrls.map(url => ({
                        url,
                        repairId: repair.id
                    }))
                })
            }

            // 返回包含图片的完整记录
            return tx.repairRequest.findUnique({
                where: { id: repair.id },
                include: { images: true }
            })
        })
    }

    /**
     * 处理报修
     */
    async processRequest(id: string, data: UpdateRepairInput) {
        const request = await prisma.repairRequest.findUnique({ where: { id } })
        if (!request) throw new NotFoundError('报修申请不存在')

        return prisma.repairRequest.update({
            where: { id },
            data: {
                status: data.status,
                note: data.note
            },
            include: { images: true }
        })
    }

    /**
     * 删除报修 (仅限租客本人且状态为 pending)
     */
    async deleteRequest(id: string, tenantId: string) {
        const request = await prisma.repairRequest.findUnique({ where: { id } })
        if (!request) throw new NotFoundError('报修申请不存在')
        if (request.tenantId !== tenantId) throw new NotFoundError('无权操作此报修')
        if (request.status !== 'pending') throw new ValidationError('只能删除待处理的报修')

        return prisma.repairRequest.delete({ where: { id } })
    }

    /**
     * 更新报修 (仅限租客本人且状态为 pending)
     */
    async updateRequest(id: string, tenantId: string, data: CreateRepairInput) {
        const request = await prisma.repairRequest.findUnique({ where: { id } })
        if (!request) throw new NotFoundError('报修申请不存在')
        if (request.tenantId !== tenantId) throw new NotFoundError('无权操作此报修')
        if (request.status !== 'pending') throw new ValidationError('只能编辑待处理的报修')

        return prisma.$transaction(async (tx) => {
            // 更新基本信息
            const updated = await tx.repairRequest.update({
                where: { id },
                data: {
                    title: data.title?.trim(),
                    description: data.description?.trim()
                }
            })

            // 如果提供了新图片列表，则替换原有图片
            // (简单策略：先删后加，或者根据需求增量。这里采用全量替换以匹配前端逻辑)
            if (data.imageUrls) {
                await tx.repairImage.deleteMany({ where: { repairId: id } })
                if (data.imageUrls.length > 0) {
                    await tx.repairImage.createMany({
                        data: data.imageUrls.map(url => ({
                            url,
                            repairId: id
                        }))
                    })
                }
            }

            return tx.repairRequest.findUnique({
                where: { id },
                include: { images: true }
            })
        })
    }
}

export const repairService = new RepairService()

