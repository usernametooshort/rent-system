/**
 * 认证中间件
 * 验证 JWT token 并提取用户信息
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../utils/jwt.js'
import { UnauthorizedError } from '../utils/errors.js'
import { JWTPayload } from '../types/index.js'

// 扩展 FastifyRequest 类型
declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload
    }
}

/**
 * JWT 认证中间件
 * 从 Authorization header 中提取并验证 token
 */
export const authenticate = async (
    request: FastifyRequest,
    _reply: FastifyReply
) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('缺少认证令牌')
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    try {
        const payload = verifyAccessToken(token)

        // 验证 token 类型
        if (payload.type !== 'access') {
            throw new UnauthorizedError('无效的令牌类型')
        }

        // 将用户信息附加到请求对象
        request.user = payload
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error
        }
        throw new UnauthorizedError('令牌无效或已过期')
    }
}

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续处理（用于游客模式）
 */
export const optionalAuthenticate = async (
    request: FastifyRequest,
    _reply: FastifyReply
) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 游客模式，不设置 user
        return
    }

    const token = authHeader.substring(7)

    try {
        const payload = verifyAccessToken(token)
        if (payload.type === 'access') {
            request.user = payload
        }
    } catch {
        // token 无效时静默忽略，作为游客处理
    }
}
