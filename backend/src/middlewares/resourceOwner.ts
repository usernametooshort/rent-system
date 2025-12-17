/**
 * 资源归属校验中间件
 * 确保租客只能访问自己绑定的房屋
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError, NotFoundError } from '../utils/errors.js'
import { prisma } from '../utils/prisma.js'

interface ParamsWithId {
    id: string
}

/**
 * 房屋归属校验
 * 管理员可访问所有房屋，租客只能访问自己绑定的房屋
 */
export const checkRoomOwnership = async (
    request: any,
    _reply: FastifyReply
) => {
    // 未认证用户不能通过此中间件
    if (!request.user) {
        throw new ForbiddenError('请先登录')
    }

    // 管理员可访问所有房屋
    if (request.user.role === 'admin') {
        return
    }

    // 租客只能访问自己绑定的房屋
    if (request.user.role === 'tenant') {
        const roomId = request.params.id

        const room = await prisma.room.findUnique({
            where: { id: roomId },
            select: { tenantId: true }
        })

        if (!room) {
            throw new NotFoundError('房屋不存在')
        }

        // 检查房屋是否属于当前租客
        if (room.tenantId !== request.user.sub) {
            throw new ForbiddenError('您无权访问此房屋')
        }
    }
}

/**
 * 租客归属校验
 * 管理员可访问所有租客，租客只能访问自己的信息
 */
export const checkTenantOwnership = async (
    request: any,
    _reply: FastifyReply
) => {
    if (!request.user) {
        throw new ForbiddenError('请先登录')
    }

    // 管理员可访问所有租客
    if (request.user.role === 'admin') {
        return
    }

    // 租客只能访问自己的信息
    if (request.user.role === 'tenant') {
        const tenantId = request.params.id

        if (tenantId !== request.user.sub) {
            throw new ForbiddenError('您无权访问此信息')
        }
    }
}

/**
 * 退租申请归属校验
 * 管理员可访问所有申请，租客只能访问自己的申请
 */
export const checkMoveOutRequestOwnership = async (
    request: any,
    _reply: FastifyReply
) => {
    if (!request.user) {
        throw new ForbiddenError('请先登录')
    }

    if (request.user.role === 'admin') {
        return
    }

    if (request.user.role === 'tenant') {
        const requestId = request.params.id

        const moveOutRequest = await prisma.moveOutRequest.findUnique({
            where: { id: requestId },
            select: { tenantId: true }
        })

        if (!moveOutRequest) {
            throw new NotFoundError('退租申请不存在')
        }

        if (moveOutRequest.tenantId !== request.user.sub) {
            throw new ForbiddenError('您无权访问此申请')
        }
    }
}
