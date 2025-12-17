/**
 * 角色权限控制中间件 (RBAC)
 * 检查用户是否具有访问特定资源的权限
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js'
import { Role } from '../types/index.js'

/**
 * 角色检查中间件工厂
 * @param allowedRoles 允许访问的角色列表
 */
export const requireRole = (...allowedRoles: Role[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        // 检查是否已认证
        if (!request.user) {
            throw new UnauthorizedError('请先登录')
        }

        // 检查角色权限
        if (!allowedRoles.includes(request.user.role)) {
            throw new ForbiddenError('您没有权限执行此操作')
        }
    }
}

/**
 * 仅管理员访问
 */
export const adminOnly = requireRole('admin')

/**
 * 管理员或租客访问
 */
export const tenantOrAdmin = requireRole('admin', 'tenant')
