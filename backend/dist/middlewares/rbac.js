"use strict";
/**
 * 角色权限控制中间件 (RBAC)
 * 检查用户是否具有访问特定资源的权限
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantOrAdmin = exports.adminOnly = exports.requireRole = void 0;
const errors_js_1 = require("../utils/errors.js");
/**
 * 角色检查中间件工厂
 * @param allowedRoles 允许访问的角色列表
 */
const requireRole = (...allowedRoles) => {
    return async (request, _reply) => {
        // 检查是否已认证
        if (!request.user) {
            throw new errors_js_1.UnauthorizedError('请先登录');
        }
        // 检查角色权限
        if (!allowedRoles.includes(request.user.role)) {
            throw new errors_js_1.ForbiddenError('您没有权限执行此操作');
        }
    };
};
exports.requireRole = requireRole;
/**
 * 仅管理员访问
 */
exports.adminOnly = (0, exports.requireRole)('admin');
/**
 * 管理员或租客访问
 */
exports.tenantOrAdmin = (0, exports.requireRole)('admin', 'tenant');
//# sourceMappingURL=rbac.js.map