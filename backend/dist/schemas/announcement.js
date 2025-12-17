"use strict";
/**
 * 公告和退租申请相关 Zod Schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveOutRequestQuerySchema = exports.announcementQuerySchema = exports.updateMoveOutRequestSchema = exports.createMoveOutRequestSchema = exports.updateAnnouncementSchema = exports.createAnnouncementSchema = void 0;
const zod_1 = require("zod");
/**
 * 创建公告请求
 */
exports.createAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '标题不能为空').max(100, '标题最长100字'),
    content: zod_1.z.string().min(1, '内容不能为空').max(5000, '内容最长5000字'),
});
/**
 * 更新公告请求
 */
exports.updateAnnouncementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, '标题不能为空').max(100, '标题最长100字').optional(),
    content: zod_1.z.string().min(1, '内容不能为空').max(5000, '内容最长5000字').optional(),
});
/**
 * 创建退租申请请求
 */
exports.createMoveOutRequestSchema = zod_1.z.object({
    preferredInspectionDate: zod_1.z.string().refine((date) => {
        const parsed = Date.parse(date);
        if (isNaN(parsed))
            return false;
        // 验房日期必须在未来
        return new Date(parsed) > new Date();
    }, '请选择未来的验房日期'),
});
/**
 * 审批退租申请请求
 */
exports.updateMoveOutRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(['approved', 'rejected'], {
        errorMap: () => ({ message: '状态只能是 approved 或 rejected' })
    }),
    note: zod_1.z.string().max(500, '备注最长500字').optional(),
});
/**
 * 公告列表查询参数
 */
exports.announcementQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('20'),
});
/**
 * 退租申请列表查询参数
 */
exports.moveOutRequestQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('20'),
    status: zod_1.z.enum(['pending', 'approved', 'rejected']).optional(),
});
//# sourceMappingURL=announcement.js.map