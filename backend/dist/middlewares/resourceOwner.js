"use strict";
/**
 * 资源归属校验中间件
 * 确保租客只能访问自己绑定的房屋
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMoveOutRequestOwnership = exports.checkTenantOwnership = exports.checkRoomOwnership = void 0;
const errors_js_1 = require("../utils/errors.js");
const prisma_js_1 = require("../utils/prisma.js");
/**
 * 房屋归属校验
 * 管理员可访问所有房屋，租客只能访问自己绑定的房屋
 */
const checkRoomOwnership = async (request, _reply) => {
    // 未认证用户不能通过此中间件
    if (!request.user) {
        throw new errors_js_1.ForbiddenError('请先登录');
    }
    // 管理员可访问所有房屋
    if (request.user.role === 'admin') {
        return;
    }
    // 租客只能访问自己绑定的房屋
    if (request.user.role === 'tenant') {
        const roomId = request.params.id;
        const room = await prisma_js_1.prisma.room.findUnique({
            where: { id: roomId },
            select: { tenantId: true }
        });
        if (!room) {
            throw new errors_js_1.NotFoundError('房屋不存在');
        }
        // 检查房屋是否属于当前租客
        if (room.tenantId !== request.user.sub) {
            throw new errors_js_1.ForbiddenError('您无权访问此房屋');
        }
    }
};
exports.checkRoomOwnership = checkRoomOwnership;
/**
 * 租客归属校验
 * 管理员可访问所有租客，租客只能访问自己的信息
 */
const checkTenantOwnership = async (request, _reply) => {
    if (!request.user) {
        throw new errors_js_1.ForbiddenError('请先登录');
    }
    // 管理员可访问所有租客
    if (request.user.role === 'admin') {
        return;
    }
    // 租客只能访问自己的信息
    if (request.user.role === 'tenant') {
        const tenantId = request.params.id;
        if (tenantId !== request.user.sub) {
            throw new errors_js_1.ForbiddenError('您无权访问此信息');
        }
    }
};
exports.checkTenantOwnership = checkTenantOwnership;
/**
 * 退租申请归属校验
 * 管理员可访问所有申请，租客只能访问自己的申请
 */
const checkMoveOutRequestOwnership = async (request, _reply) => {
    if (!request.user) {
        throw new errors_js_1.ForbiddenError('请先登录');
    }
    if (request.user.role === 'admin') {
        return;
    }
    if (request.user.role === 'tenant') {
        const requestId = request.params.id;
        const moveOutRequest = await prisma_js_1.prisma.moveOutRequest.findUnique({
            where: { id: requestId },
            select: { tenantId: true }
        });
        if (!moveOutRequest) {
            throw new errors_js_1.NotFoundError('退租申请不存在');
        }
        if (moveOutRequest.tenantId !== request.user.sub) {
            throw new errors_js_1.ForbiddenError('您无权访问此申请');
        }
    }
};
exports.checkMoveOutRequestOwnership = checkMoveOutRequestOwnership;
//# sourceMappingURL=resourceOwner.js.map