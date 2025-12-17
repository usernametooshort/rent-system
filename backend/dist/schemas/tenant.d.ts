/**
 * 租客相关 Zod Schema
 */
import { z } from 'zod';
/**
 * 创建租客请求
 */
export declare const createTenantSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    roomId: z.ZodString;
    leaseStartDate: z.ZodEffects<z.ZodString, string, string>;
    leaseDurationMonths: z.ZodNumber;
    wifiPassword: z.ZodOptional<z.ZodString>;
    lockPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomId: string;
    name: string;
    phone: string;
    leaseStartDate: string;
    leaseDurationMonths: number;
    wifiPassword?: string | undefined;
    lockPassword?: string | undefined;
}, {
    roomId: string;
    name: string;
    phone: string;
    leaseStartDate: string;
    leaseDurationMonths: number;
    wifiPassword?: string | undefined;
    lockPassword?: string | undefined;
}>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
/**
 * 更新租客请求
 */
export declare const updateTenantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    leaseStartDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    leaseDurationMonths: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    leaseStartDate?: string | undefined;
    leaseDurationMonths?: number | undefined;
}, {
    name?: string | undefined;
    leaseStartDate?: string | undefined;
    leaseDurationMonths?: number | undefined;
}>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
/**
 * 租金记录 Schema
 */
export declare const rentRecordSchema: z.ZodObject<{
    month: z.ZodString;
    amount: z.ZodNumber;
    paid: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    month: string;
    amount: number;
    paid: boolean;
}, {
    month: string;
    amount: number;
    paid?: boolean | undefined;
}>;
export type RentRecordInput = z.infer<typeof rentRecordSchema>;
/**
 * 更新租金记录（标记已缴）
 */
export declare const updateRentRecordSchema: z.ZodObject<{
    paid: z.ZodBoolean;
    paidAt: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    paid: boolean;
    paidAt?: string | undefined;
}, {
    paid: boolean;
    paidAt?: string | undefined;
}>;
export type UpdateRentRecordInput = z.infer<typeof updateRentRecordSchema>;
/**
 * 租客列表查询参数
 */
export declare const tenantQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: string | undefined;
}, {
    status?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type TenantQueryInput = z.infer<typeof tenantQuerySchema>;
//# sourceMappingURL=tenant.d.ts.map