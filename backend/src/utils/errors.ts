/**
 * 统一错误处理模块
 * 提供自定义错误类和错误处理函数
 */

import { FastifyReply } from 'fastify'
import { ErrorCodes, ApiError } from '../types/index.js'

// ============ 自定义错误基类 ============
export class AppError extends Error {
    public statusCode: number
    public code: string
    public details?: Array<{ field: string; message: string }>

    constructor(
        message: string,
        statusCode: number,
        code: string,
        details?: Array<{ field: string; message: string }>
    ) {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.details = details
        Error.captureStackTrace(this, this.constructor)
    }
}

// ============ 具体错误类 ============

/**
 * 401 未认证错误
 */
export class UnauthorizedError extends AppError {
    constructor(message = '请先登录') {
        super(message, 401, ErrorCodes.UNAUTHORIZED)
    }
}

/**
 * 403 禁止访问错误
 */
export class ForbiddenError extends AppError {
    constructor(message = '无权访问该资源') {
        super(message, 403, ErrorCodes.FORBIDDEN)
    }
}

/**
 * 404 资源不存在错误
 */
export class NotFoundError extends AppError {
    constructor(message = '资源不存在') {
        super(message, 404, ErrorCodes.NOT_FOUND)
    }
}

/**
 * 409 资源冲突错误
 */
export class ConflictError extends AppError {
    constructor(message = '资源已存在') {
        super(message, 409, ErrorCodes.CONFLICT)
    }
}

/**
 * 400 验证错误
 */
export class ValidationError extends AppError {
    constructor(
        message = '请求参数无效',
        details?: Array<{ field: string; message: string }>
    ) {
        super(message, 400, ErrorCodes.VALIDATION_ERROR, details)
    }
}

/**
 * 429 请求过于频繁
 */
export class TooManyRequestsError extends AppError {
    constructor(message = '请求过于频繁，请稍后再试') {
        super(message, 429, ErrorCodes.TOO_MANY_REQUESTS)
    }
}

// ============ 错误响应格式化 ============
export const formatErrorResponse = (error: AppError): { error: ApiError } => {
    return {
        error: {
            code: error.code,
            message: error.message,
            details: error.details,
        },
    }
}

// ============ 全局错误处理 ============
export const errorHandler = (
    error: Error,
    _request: unknown,
    reply: FastifyReply
) => {
    // 处理自定义错误
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            ...formatErrorResponse(error),
        })
    }

    // 处理 Zod 验证错误
    if (error.name === 'ZodError') {
        const zodError = error as unknown as { errors: Array<{ path: string[]; message: string }> }
        return reply.status(400).send({
            success: false,
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: '请求参数验证失败',
                details: zodError.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        })
    }

    // 处理未知错误
    console.error('未处理的错误:', error)
    return reply.status(500).send({
        success: false,
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: '服务器内部错误',
        },
    })
}
