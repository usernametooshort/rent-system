/**
 * 认证中间件
 * 验证 JWT token 并提取用户信息
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../types/index.js';
declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload;
    }
}
/**
 * JWT 认证中间件
 * 从 Authorization header 中提取并验证 token
 */
export declare const authenticate: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续处理（用于游客模式）
 */
export declare const optionalAuthenticate: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map