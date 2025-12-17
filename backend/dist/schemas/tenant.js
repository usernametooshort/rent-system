"use strict";
/**
 * 租客相关 Zod Schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantQuerySchema = exports.updateRentRecordSchema = exports.rentRecordSchema = exports.updateTenantSchema = exports.createTenantSchema = void 0;
const zod_1 = require("zod");
/**
 * 创建租客请求
 */
exports.createTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '姓名不能为空'),
    phone: zod_1.z.string()
        .min(11, '请输入完整的手机号')
        .max(11, '手机号格式不正确')
        .regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    roomId: zod_1.z.string().min(1, '请选择房间'),
    leaseStartDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), '起租日期格式不正确'),
    leaseDurationMonths: zod_1.z.number()
        .int('租期必须为整数')
        .min(1, '租期至少1个月')
        .max(60, '租期最长60个月'),
    wifiPassword: zod_1.z.string().optional(),
    lockPassword: zod_1.z.string().optional(),
});
/**
 * 更新租客请求
 */
exports.updateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '姓名不能为空').optional(),
    leaseStartDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), '起租日期格式不正确').optional(),
    leaseDurationMonths: zod_1.z.number()
        .int('租期必须为整数')
        .min(1, '租期至少1个月')
        .max(60, '租期最长60个月')
        .optional(),
});
/**
 * 租金记录 Schema
 */
exports.rentRecordSchema = zod_1.z.object({
    month: zod_1.z.string().regex(/^\d{4}-\d{2}$/, '月份格式应为 YYYY-MM'),
    amount: zod_1.z.number().min(0, '金额不能为负数'),
    paid: zod_1.z.boolean().optional().default(false),
});
/**
 * 更新租金记录（标记已缴）
 */
exports.updateRentRecordSchema = zod_1.z.object({
    paid: zod_1.z.boolean(),
    paidAt: zod_1.z.string().refine((date) => !date || !isNaN(Date.parse(date)), '缴费日期格式不正确').optional(),
});
/**
 * 租客列表查询参数
 */
exports.tenantQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('20'),
    status: zod_1.z.string().optional(), // 'active' | 'moved_out'
});
//# sourceMappingURL=tenant.js.map