/**
 * 房屋相关 Zod Schema
 */
import { z } from 'zod';
/**
 * 家电 Schema
 */
export declare const applianceSchema: z.ZodObject<{
    name: z.ZodString;
    compensationPrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    compensationPrice: number;
}, {
    name: string;
    compensationPrice: number;
}>;
export type ApplianceInput = z.infer<typeof applianceSchema>;
/**
 * 创建房屋请求
 */
export declare const createRoomSchema: z.ZodObject<{
    roomNumber: z.ZodString;
    rent: z.ZodNumber;
    deposit: z.ZodNumber;
    appliances: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        compensationPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        compensationPrice: number;
    }, {
        name: string;
        compensationPrice: number;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    roomNumber: string;
    rent: number;
    deposit: number;
    appliances: {
        name: string;
        compensationPrice: number;
    }[];
}, {
    roomNumber: string;
    rent: number;
    deposit: number;
    appliances?: {
        name: string;
        compensationPrice: number;
    }[] | undefined;
}>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
/**
 * 更新房屋请求
 */
export declare const updateRoomSchema: z.ZodObject<{
    roomNumber: z.ZodOptional<z.ZodString>;
    rent: z.ZodOptional<z.ZodNumber>;
    deposit: z.ZodOptional<z.ZodNumber>;
    wifiPassword: z.ZodOptional<z.ZodString>;
    lockPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roomNumber?: string | undefined;
    rent?: number | undefined;
    deposit?: number | undefined;
    wifiPassword?: string | undefined;
    lockPassword?: string | undefined;
}, {
    roomNumber?: string | undefined;
    rent?: number | undefined;
    deposit?: number | undefined;
    wifiPassword?: string | undefined;
    lockPassword?: string | undefined;
}>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
/**
 * 添加家电请求
 */
export declare const addApplianceSchema: z.ZodObject<{
    name: z.ZodString;
    compensationPrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    compensationPrice: number;
}, {
    name: string;
    compensationPrice: number;
}>;
export type AddApplianceInput = z.infer<typeof addApplianceSchema>;
/**
 * 房屋列表查询参数
 */
export declare const roomQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>>;
    status: z.ZodOptional<z.ZodEnum<["vacant", "rented"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "vacant" | "rented" | undefined;
}, {
    status?: "vacant" | "rented" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export type RoomQueryInput = z.infer<typeof roomQuerySchema>;
//# sourceMappingURL=room.d.ts.map