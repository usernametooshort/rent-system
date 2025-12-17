"use strict";
/**
 * 认证相关 Zod Schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminProfileSchema = exports.createAdminSchema = exports.resetTenantPasswordSchema = exports.changePasswordSchema = exports.refreshTokenSchema = exports.tenantLoginSchema = exports.adminLoginSchema = void 0;
const zod_1 = require("zod");
/**
 * 管理员登录请求
 */
exports.adminLoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, '用户名不能为空'),
    password: zod_1.z.string().min(1, '密码不能为空'),
});
/**
 * 租客登录请求
 * 使用姓名 + 房间号 + 手机后6位验证
 */
exports.tenantLoginSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '姓名不能为空'),
    roomNumber: zod_1.z.string().min(1, '房间号不能为空'),
    phoneLast6: zod_1.z.string()
        .length(6, '请输入手机号后6位')
        .regex(/^\d{6}$/, '手机号后6位必须为数字'),
});
/**
 * Token 刷新请求
 */
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, '刷新令牌不能为空'),
});
/**
 * 修改密码请求
 */
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, '旧密码不能为空'),
    newPassword: zod_1.z.string().min(6, '新密码至少6位'),
});
/**
 * 重置租客密码请求
 */
exports.resetTenantPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(6, '新密码至少6位'),
});
/**
 * 创建管理员请求
 */
exports.createAdminSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, '用户名至少3位').max(20, '用户名最多20位'),
    password: zod_1.z.string().min(6, '密码至少6位'),
});
/**
 * 更新管理员资料请求
 */
exports.updateAdminProfileSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, '用户名至少3位').max(20, '用户名最多20位'),
});
//# sourceMappingURL=auth.js.map