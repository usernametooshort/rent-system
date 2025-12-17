/**
 * 类型定义模块
 * 定义所有共享类型、接口和枚举
 */

import { FastifyRequest } from 'fastify'

// ============ 角色类型 ============
export type Role = 'admin' | 'tenant' | 'guest'

// ============ JWT Payload ============
export interface JWTPayload {
    sub: string          // 用户 ID
    role: Role
    type: 'access' | 'refresh'
    iat: number
    exp: number
    // 租客特有字段
    roomId?: string
    name?: string
}

// ============ 扩展 FastifyRequest ============
export interface AuthenticatedRequest extends FastifyRequest {
    user: JWTPayload
}

// ============ 房屋状态 ============
export type RoomStatus = 'vacant' | 'rented'

// ============ 退租申请状态 ============
export type MoveOutStatus = 'pending' | 'approved' | 'rejected'

// ============ 统一响应格式 ============
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: ApiError
}

export interface ApiError {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
}

// ============ 分页参数 ============
export interface PaginationParams {
    page?: number
    limit?: number
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// ============ 错误码 ============
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodes
