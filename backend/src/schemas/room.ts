/**
 * 房屋相关 Zod Schema
 */

import { z } from 'zod'

/**
 * 家电 Schema
 */
export const applianceSchema = z.object({
    name: z.string().min(1, '家电名称不能为空'),
    compensationPrice: z.number().min(0, '赔偿金额不能为负数'),
})

export type ApplianceInput = z.infer<typeof applianceSchema>

/**
 * 创建房屋请求
 */
export const createRoomSchema = z.object({
    roomNumber: z.string().min(1, '房间号不能为空'),
    rent: z.number().min(0, '租金不能为负数'),
    deposit: z.number().min(0, '押金不能为负数'),
    appliances: z.array(applianceSchema).optional().default([]),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>

/**
 * 更新房屋请求
 */
export const updateRoomSchema = z.object({
    roomNumber: z.string().min(1, '房间号不能为空').optional(),
    rent: z.number().min(0, '租金不能为负数').optional(),
    deposit: z.number().min(0, '押金不能为负数').optional(),
})

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>

/**
 * 添加家电请求
 */
export const addApplianceSchema = applianceSchema

export type AddApplianceInput = z.infer<typeof addApplianceSchema>

/**
 * 房屋列表查询参数
 */
export const roomQuerySchema = z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('20'),
    status: z.enum(['vacant', 'rented']).optional(),
})

export type RoomQueryInput = z.infer<typeof roomQuerySchema>
