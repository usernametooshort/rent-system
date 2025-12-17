/**
 * 公告和退租申请相关 Zod Schema
 */
import { z } from 'zod';
/**
 * 创建公告请求
 */
export declare const createAnnouncementSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
}, {
    content: string;
    title: string;
}>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
/**
 * 更新公告请求
 */
export declare const updateAnnouncementSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    title?: string | undefined;
}, {
    content?: string | undefined;
    title?: string | undefined;
}>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
/**
 * 创建退租申请请求
 */
export declare const createMoveOutRequestSchema: z.ZodObject<{
    preferredInspectionDate: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    preferredInspectionDate: string;
}, {
    preferredInspectionDate: string;
}>;
export type CreateMoveOutRequestInput = z.infer<typeof createMoveOutRequestSchema>;
/**
 * 审批退租申请请求
 */
export declare const updateMoveOutRequestSchema: z.ZodObject<{
    status: z.ZodEnum<["approved", "rejected"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "approved" | "rejected";
    note?: string | undefined;
}, {
    status: "approved" | "rejected";
    note?: string | undefined;
}>;
export type UpdateMoveOutRequestInput = z.infer<typeof updateMoveOutRequestSchema>;
/**
 * 公告列表查询参数
 */
export declare const announcementQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type AnnouncementQueryInput = z.infer<typeof announcementQuerySchema>;
/**
 * 退租申请列表查询参数
 */
export declare const moveOutRequestQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "approved", "rejected"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "pending" | "approved" | "rejected" | undefined;
}, {
    status?: "pending" | "approved" | "rejected" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type MoveOutRequestQueryInput = z.infer<typeof moveOutRequestQuerySchema>;
//# sourceMappingURL=announcement.d.ts.map