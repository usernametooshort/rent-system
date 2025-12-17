/**
 * 角色权限控制中间件 (RBAC)
 * 检查用户是否具有访问特定资源的权限
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '../types/index.js';
/**
 * 角色检查中间件工厂
 * @param allowedRoles 允许访问的角色列表
 */
export declare const requireRole: (...allowedRoles: Role[]) => (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
/**
 * 仅管理员访问
 */
export declare const adminOnly: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
/**
 * 管理员或租客访问
 */
export declare const tenantOrAdmin: (request: FastifyRequest, _reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=rbac.d.ts.map