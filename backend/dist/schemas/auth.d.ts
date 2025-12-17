/**
 * 认证相关 Zod Schema
 */
import { z } from 'zod';
/**
 * 管理员登录请求
 */
export declare const adminLoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
/**
 * 租客登录请求
 * 使用姓名 + 房间号 + 手机后6位验证
 */
export declare const tenantLoginSchema: z.ZodObject<{
    name: z.ZodString;
    roomNumber: z.ZodString;
    phoneLast6: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    roomNumber: string;
    phoneLast6: string;
}, {
    name: string;
    roomNumber: string;
    phoneLast6: string;
}>;
export type TenantLoginInput = z.infer<typeof tenantLoginSchema>;
/**
 * Token 刷新请求
 */
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
/**
 * 修改密码请求
 */
export declare const changePasswordSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    oldPassword: string;
    newPassword: string;
}, {
    oldPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
/**
 * 重置租客密码请求
 */
export declare const resetTenantPasswordSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
}, {
    newPassword: string;
}>;
export type ResetTenantPasswordInput = z.infer<typeof resetTenantPasswordSchema>;
/**
 * 创建管理员请求
 */
export declare const createAdminSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
/**
 * 更新管理员资料请求
 */
export declare const updateAdminProfileSchema: z.ZodObject<{
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
}, {
    username: string;
}>;
export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;
//# sourceMappingURL=auth.d.ts.map