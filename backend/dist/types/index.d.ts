/**
 * 类型定义模块
 * 定义所有共享类型、接口和枚举
 */
import { FastifyRequest } from 'fastify';
export type Role = 'admin' | 'tenant' | 'guest';
export interface JWTPayload {
    sub: string;
    role: Role;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
    roomId?: string;
    name?: string;
}
export interface AuthenticatedRequest extends FastifyRequest {
    user: JWTPayload;
}
export type RoomStatus = 'vacant' | 'rented';
export type MoveOutStatus = 'pending' | 'approved' | 'rejected';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = keyof typeof ErrorCodes;
//# sourceMappingURL=index.d.ts.map