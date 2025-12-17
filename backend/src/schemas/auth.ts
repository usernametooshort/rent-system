/**
 * 认证相关 Zod Schema
 */

import { z } from 'zod'

/**
 * 管理员登录请求
 */
export const adminLoginSchema = z.object({
    username: z.string().min(1, '用户名不能为空'),
    password: z.string().min(1, '密码不能为空'),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

/**
 * 租客登录请求
 * 使用姓名 + 房间号 + 手机后6位验证
 */
export const tenantLoginSchema = z.object({
    name: z.string().min(1, '姓名不能为空'),
    roomNumber: z.string().min(1, '房间号不能为空'),
    phoneLast6: z.string()
        .length(6, '请输入手机号后6位')
        .regex(/^\d{6}$/, '手机号后6位必须为数字'),
})

export type TenantLoginInput = z.infer<typeof tenantLoginSchema>

/**
 * Token 刷新请求
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, '刷新令牌不能为空'),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
