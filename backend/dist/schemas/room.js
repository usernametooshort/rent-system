"use strict";
/**
 * 房屋相关 Zod Schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomQuerySchema = exports.addApplianceSchema = exports.updateRoomSchema = exports.createRoomSchema = exports.applianceSchema = void 0;
const zod_1 = require("zod");
/**
 * 家电 Schema
 */
exports.applianceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, '家电名称不能为空'),
    compensationPrice: zod_1.z.number().min(0, '赔偿金额不能为负数'),
});
/**
 * 创建房屋请求
 */
exports.createRoomSchema = zod_1.z.object({
    roomNumber: zod_1.z.string().min(1, '房间号不能为空'),
    rent: zod_1.z.number().min(0, '租金不能为负数'),
    deposit: zod_1.z.number().min(0, '押金不能为负数'),
    appliances: zod_1.z.array(exports.applianceSchema).optional().default([]),
});
/**
 * 更新房屋请求
 */
exports.updateRoomSchema = zod_1.z.object({
    roomNumber: zod_1.z.string().min(1, '房间号不能为空').optional(),
    rent: zod_1.z.number().min(0, '租金不能为负数').optional(),
    deposit: zod_1.z.number().min(0, '押金不能为负数').optional(),
    wifiPassword: zod_1.z.string().optional(),
    lockPassword: zod_1.z.string().optional(),
});
/**
 * 添加家电请求
 */
exports.addApplianceSchema = exports.applianceSchema;
/**
 * 房屋列表查询参数
 */
exports.roomQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional().default('1'),
    limit: zod_1.z.string().transform(Number).optional().default('20'),
    status: zod_1.z.enum(['vacant', 'rented']).optional(),
});
//# sourceMappingURL=room.js.map