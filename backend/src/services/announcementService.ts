import { prisma } from '../utils/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import {
    CreateAnnouncementInput,
    UpdateAnnouncementInput,
    CreateMoveOutRequestInput,
    UpdateMoveOutRequestInput,
    AnnouncementQueryInput,
    MoveOutRequestQueryInput
} from '../schemas/announcement.js'

export class AnnouncementService {
    /**
     * 获取公告列表
     */
    async getAnnouncements(query: AnnouncementQueryInput) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 20
        const skip = (page - 1) * limit

        const [items, total] = await Promise.all([
            prisma.announcement.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.announcement.count()
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
     * 创建公告
     */
    async createAnnouncement(data: CreateAnnouncementInput) {
        return prisma.announcement.create({
            data
        })
    }

    /**
     * 删除公告
     */
    async deleteAnnouncement(id: string) {
        try {
            await prisma.announcement.delete({ where: { id } })
            return { success: true }
        } catch {
            throw new NotFoundError('公告不存在')
        }
    }

    /**
     * 更新公告
     */
    async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
        const existing = await prisma.announcement.findUnique({ where: { id } })
        if (!existing) throw new NotFoundError('公告不存在')

        return prisma.announcement.update({
            where: { id },
            data
        })
    }
}

export class MoveOutService {
    /**
     * 获取退租申请列表
     */
    async getRequests(query: MoveOutRequestQueryInput) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status) {
            where.status = query.status
        }

        const [items, total] = await Promise.all([
            prisma.moveOutRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    tenant: {
                        include: { room: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.moveOutRequest.count({ where })
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
     * 获取租客自己的申请
     */
    async getMyRequests(tenantId: string) {
        return prisma.moveOutRequest.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        })
    }

    /**
     * 提交退租申请
     */
    async createRequest(tenantId: string, data: CreateMoveOutRequestInput) {
        // 检查是否有未处理的申请
        const pending = await prisma.moveOutRequest.findFirst({
            where: {
                tenantId,
                status: 'pending'
            }
        })

        if (pending) {
            throw new ValidationError('您已有一个待处理的退租申请')
        }

        return prisma.moveOutRequest.create({
            data: {
                tenantId,
                preferredInspectionDate: new Date(data.preferredInspectionDate),
                status: 'pending'
            }
        })
    }

    /**
     * 审批退租申请
     */
    async processRequest(id: string, data: UpdateMoveOutRequestInput) {
        const request = await prisma.moveOutRequest.findUnique({ where: { id } })
        if (!request) throw new NotFoundError('申请不存在')

        if (request.status !== 'pending') {
            throw new ValidationError('只能处理待审批的申请')
        }

        return prisma.moveOutRequest.update({
            where: { id },
            data: {
                status: data.status,
                note: data.note
            }
        })
    }
}

export const announcementService = new AnnouncementService()
export const moveOutService = new MoveOutService()
