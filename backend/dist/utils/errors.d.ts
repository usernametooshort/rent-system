/**
 * 统一错误处理模块
 * 提供自定义错误类和错误处理函数
 */
import { FastifyReply } from 'fastify';
import { ApiError } from '../types/index.js';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, statusCode: number, code: string, details?: Array<{
        field: string;
        message: string;
    }>);
}
/**
 * 401 未认证错误
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * 403 禁止访问错误
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * 404 资源不存在错误
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * 409 资源冲突错误
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * 400 验证错误
 */
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: Array<{
        field: string;
        message: string;
    }>);
}
/**
 * 429 请求过于频繁
 */
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare const formatErrorResponse: (error: AppError) => {
    error: ApiError;
};
export declare const errorHandler: (error: Error, _request: unknown, reply: FastifyReply) => FastifyReply<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").RouteGenericInterface, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
//# sourceMappingURL=errors.d.ts.map