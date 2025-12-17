import { prisma } from '../utils/prisma.js'
import {
    ConflictError,
    NotFoundError,
    ValidationError
} from '../utils/errors.js'
import {
    CreateRoomInput,
    UpdateRoomInput,
    AddApplianceInput,
    RoomQueryInput
} from '../schemas/room.js'

export class RoomService {
    /**
     * 获取房间列表
     */
    async getRooms(query: RoomQueryInput) {
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 20
        const skip = (page - 1) * limit

        // 构建查询条件
        const where: any = {}
        if (query.status) {
            where.status = query.status
        }

        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                skip,
                take: limit,
                include: {
                    appliances: true,
                    images: {
                        orderBy: { order: 'asc' }
                    },
                    // 仅返回 tenantId，不返回详细敏感信息
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            leaseStartDate: true
                        }
                    }
                },
                orderBy: { roomNumber: 'asc' }
            }),
            prisma.room.count({ where })
        ])

        return {
            items: rooms,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    /**
     * 获取房间详情
     */
    async getRoomById(id: string) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                appliances: true,
                images: {
                    orderBy: { order: 'asc' }
                },
                tenant: {
                    include: {
                        rentRecords: {
                            orderBy: { month: 'desc' },
                            take: 12
                        }
                    }
                }
            }
        })

        if (!room) {
            throw new NotFoundError('房间不存在')
        }

        return room
    }

    /**
     * 创建房间
     */
    async createRoom(data: CreateRoomInput) {
        // 检查房间号是否重复
        const existing = await prisma.room.findUnique({
            where: { roomNumber: data.roomNumber }
        })

        if (existing) {
            throw new ConflictError(`房间号 ${data.roomNumber} 已存在`)
        }

        const room = await prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                rent: data.rent,
                deposit: data.deposit,
                status: 'vacant',
                appliances: {
                    create: data.appliances
                }
            },
            include: {
                appliances: true
            }
        })

        return room
    }

    /**
     * 更新房间
     */
    async updateRoom(id: string, data: UpdateRoomInput) {
        const room = await prisma.room.findUnique({ where: { id } })
        if (!room) {
            throw new NotFoundError('房间不存在')
        }

        // 如果修改房间号，检查是否冲突
        if (data.roomNumber && data.roomNumber !== room.roomNumber) {
            const existing = await prisma.room.findUnique({
                where: { roomNumber: data.roomNumber }
            })
            if (existing) {
                throw new ConflictError(`房间号 ${data.roomNumber} 已存在`)
            }
        }

        return prisma.room.update({
            where: { id },
            data,
            include: { appliances: true, images: true }
        })
    }

    /**
     * 删除房间
     */
    async deleteRoom(id: string) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: { tenant: true } // 检查是否有租客
        })

        if (!room) {
            throw new NotFoundError('房间不存在')
        }

        if (room.status === 'rented' || room.tenant) {
            throw new ValidationError('无法删除已出租的房间，请先解绑租客')
        }

        await prisma.room.delete({ where: { id } })
        return { id }
    }

    /**
     * 添加家电
     */
    async addAppliance(roomId: string, data: AddApplianceInput) {
        const room = await prisma.room.findUnique({ where: { id: roomId } })
        if (!room) throw new NotFoundError('房间不存在')

        return prisma.appliance.create({
            data: {
                ...data,
                roomId
            }
        })
    }

    /**
     * 删除家电
     */
    async deleteAppliance(roomId: string, applianceId: string) {
        const appliance = await prisma.appliance.findFirst({
            where: { id: applianceId, roomId }
        })

        if (!appliance) throw new NotFoundError('家电不存在')

        await prisma.appliance.delete({ where: { id: applianceId } })
        return { id: applianceId }
    }
}

export const roomService = new RoomService()
