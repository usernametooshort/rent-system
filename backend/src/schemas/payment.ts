/**
 * 付款相关 Zod Schema
 */

import { z } from 'zod'

/**
 * 更新付款设置（管理员）
 */
export const updatePaymentSettingsSchema = z.object({
    wechatQrCodeUrl: z.string().optional(),
    paymentNote: z.string().optional(),
})

export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>

/**
 * 提交付款凭证（租客）
 */
export const submitPaymentProofSchema = z.object({
    paymentProofUrl: z.string().min(1, '请上传付款凭证截图'),
})

export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>

/**
 * 确认付款（管理员）
 */
export const confirmPaymentSchema = z.object({
    confirmed: z.boolean(),
    paymentNote: z.string().optional(),
})

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>
