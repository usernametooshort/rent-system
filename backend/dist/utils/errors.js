"use strict";
/**
 * 统一错误处理模块
 * 提供自定义错误类和错误处理函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.formatErrorResponse = exports.TooManyRequestsError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.AppError = void 0;
const index_js_1 = require("../types/index.js");
// ============ 自定义错误基类 ============
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// ============ 具体错误类 ============
/**
 * 401 未认证错误
 */
class UnauthorizedError extends AppError {
    constructor(message = '请先登录') {
        super(message, 401, index_js_1.ErrorCodes.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 禁止访问错误
 */
class ForbiddenError extends AppError {
    constructor(message = '无权访问该资源') {
        super(message, 403, index_js_1.ErrorCodes.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 资源不存在错误
 */
class NotFoundError extends AppError {
    constructor(message = '资源不存在') {
        super(message, 404, index_js_1.ErrorCodes.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 资源冲突错误
 */
class ConflictError extends AppError {
    constructor(message = '资源已存在') {
        super(message, 409, index_js_1.ErrorCodes.CONFLICT);
    }
}
exports.ConflictError = ConflictError;
/**
 * 400 验证错误
 */
class ValidationError extends AppError {
    constructor(message = '请求参数无效', details) {
        super(message, 400, index_js_1.ErrorCodes.VALIDATION_ERROR, details);
    }
}
exports.ValidationError = ValidationError;
/**
 * 429 请求过于频繁
 */
class TooManyRequestsError extends AppError {
    constructor(message = '请求过于频繁，请稍后再试') {
        super(message, 429, index_js_1.ErrorCodes.TOO_MANY_REQUESTS);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
// ============ 错误响应格式化 ============
const formatErrorResponse = (error) => {
    return {
        error: {
            code: error.code,
            message: error.message,
            details: error.details,
        },
    };
};
exports.formatErrorResponse = formatErrorResponse;
// ============ 全局错误处理 ============
const errorHandler = (error, _request, reply) => {
    // 处理自定义错误
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            ...(0, exports.formatErrorResponse)(error),
        });
    }
    // 处理 Zod 验证错误
    if (error.name === 'ZodError') {
        const zodError = error;
        return reply.status(400).send({
            success: false,
            error: {
                code: index_js_1.ErrorCodes.VALIDATION_ERROR,
                message: '请求参数验证失败',
                details: zodError.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
    }
    // 处理未知错误
    console.error('未处理的错误:', error);
    return reply.status(500).send({
        success: false,
        error: {
            code: index_js_1.ErrorCodes.INTERNAL_ERROR,
            message: '服务器内部错误',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errors.js.map