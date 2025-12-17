/**
 * 租客相关 Zod Schema
 */

import { z } from 'zod'

/**
 * 创建租客请求
 */
export const createTenantSchema = z.object({
    name: z.string().min(1, '姓名不能为空'),
    phone: z.string()
        .min(11, '请输入完整的手机号')
        .max(11, '手机号格式不正确')
        .regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    roomId: z.string().min(1, '请选择房间'),
    leaseStartDate: z.string().refine(
        (date) => !isNaN(Date.parse(date)),
        '起租日期格式不正确'
    ),
    leaseDurationMonths: z.number()
        .int('租期必须为整数')
        .min(1, '租期至少1个月')
        .max(60, '租期最长60个月'),
    wifiPassword: z.string().optional(),
    lockPassword: z.string().optional(),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

/**
 * 更新租客请求
 */
export const updateTenantSchema = z.object({
    name: z.string().min(1, '姓名不能为空').optional(),
    leaseStartDate: z.string().refine(
        (date) => !isNaN(Date.parse(date)),
        '起租日期格式不正确'
    ).optional(),
    leaseDurationMonths: z.number()
        .int('租期必须为整数')
        .min(1, '租期至少1个月')
        .max(60, '租期最长60个月')
        .optional(),
})

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>

/**
 * 租金记录 Schema
 */
export const rentRecordSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, '月份格式应为 YYYY-MM'),
    amount: z.number().min(0, '金额不能为负数'),
    paid: z.boolean().optional().default(false),
})

export type RentRecordInput = z.infer<typeof rentRecordSchema>

/**
 * 更新租金记录（标记已缴）
 */
export const updateRentRecordSchema = z.object({
    paid: z.boolean(),
    paidAt: z.string().refine(
        (date) => !date || !isNaN(Date.parse(date)),
        '缴费日期格式不正确'
    ).optional(),
})

export type UpdateRentRecordInput = z.infer<typeof updateRentRecordSchema>

/**
 * 租客列表查询参数
 */
export const tenantQuerySchema = z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('20'),
    status: z.string().optional(), // 'active' | 'moved_out'
})

export type TenantQueryInput = z.infer<typeof tenantQuerySchema>
