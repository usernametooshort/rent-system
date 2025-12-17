/**
 * 资源归属校验中间件
 * 确保租客只能访问自己绑定的房屋
 */
import { FastifyReply } from 'fastify';
/**
 * 房屋归属校验
 * 管理员可访问所有房屋，租客只能访问自己绑定的房屋
 */
export declare const checkRoomOwnership: (request: any, _reply: FastifyReply) => Promise<void>;
/**
 * 租客归属校验
 * 管理员可访问所有租客，租客只能访问自己的信息
 */
export declare const checkTenantOwnership: (request: any, _reply: FastifyReply) => Promise<void>;
/**
 * 退租申请归属校验
 * 管理员可访问所有申请，租客只能访问自己的申请
 */
export declare const checkMoveOutRequestOwnership: (request: any, _reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=resourceOwner.d.ts.map