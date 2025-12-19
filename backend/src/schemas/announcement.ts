/**
 * 公告和退租申请相关 Zod Schema
 */

import { z } from 'zod'

/**
 * 创建公告请求
 */
export const createAnnouncementSchema = z.object({
    title: z.string().min(1, '标题不能为空').max(100, '标题最长100字'),
    content: z.string().min(1, '内容不能为空').max(5000, '内容最长5000字'),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>

/**
 * 更新公告请求
 */
export const updateAnnouncementSchema = z.object({
    title: z.string().min(1, '标题不能为空').max(100, '标题最长100字').optional(),
    content: z.string().min(1, '内容不能为空').max(5000, '内容最长5000字').optional(),
})

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>

/**
 * 创建退租申请请求
 */
export const createMoveOutRequestSchema = z.object({
    preferredInspectionDate: z.string().refine(
        (date) => {
            const parsed = Date.parse(date)
            if (isNaN(parsed)) return false
            // 验房日期必须在未来
            return new Date(parsed) > new Date()
        },
        '请选择未来的验房日期'
    ),
})

export type CreateMoveOutRequestInput = z.infer<typeof createMoveOutRequestSchema>

/**
 * 审批退租申请请求
 */
export const updateMoveOutRequestSchema = z.object({
    status: z.enum(['approved', 'rejected'], {
        errorMap: () => ({ message: '状态只能是 approved 或 rejected' })
    }),
    note: z.string().max(500, '备注最长500字').optional(),
    refundAmount: z.number().min(0).optional(),
    refundPlan: z.array(z.object({
        name: z.string(),
        amount: z.number()
    })).optional(),
})

export type UpdateMoveOutRequestInput = z.infer<typeof updateMoveOutRequestSchema>

/**
 * 公告列表查询参数
 */
export const announcementQuerySchema = z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('20'),
})

export type AnnouncementQueryInput = z.infer<typeof announcementQuerySchema>

/**
 * 退租申请列表查询参数
 */
export const moveOutRequestQuerySchema = z.object({
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('20'),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export type MoveOutRequestQueryInput = z.infer<typeof moveOutRequestQuerySchema>
