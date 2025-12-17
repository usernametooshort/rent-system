import { CreateTenantInput, UpdateTenantInput, TenantQueryInput, RentRecordInput, UpdateRentRecordInput } from '../schemas/tenant.js';
export declare class TenantService {
    /**
     * 获取租客列表
     */
    getTenants(query: TenantQueryInput): Promise<{
        items: ({
            room: {
                status: string;
                roomNumber: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string | null;
                rent: number;
                deposit: number;
                wifiPassword: string | null;
                lockPassword: string | null;
            } | null;
            rentRecords: {
                id: string;
                createdAt: Date;
                tenantId: string;
                month: string;
                amount: number;
                paid: boolean;
                paidAt: Date | null;
            }[];
        } & {
            status: string;
            name: string;
            phoneLast6: string;
            id: string;
            passwordHash: string | null;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            leaseStartDate: Date;
            leaseDurationMonths: number;
            checkOutDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取租客详情
     */
    getTenantById(id: string): Promise<{
        room: {
            status: string;
            roomNumber: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            rent: number;
            deposit: number;
            wifiPassword: string | null;
            lockPassword: string | null;
        } | null;
        rentRecords: {
            id: string;
            createdAt: Date;
            tenantId: string;
            month: string;
            amount: number;
            paid: boolean;
            paidAt: Date | null;
        }[];
        moveOutRequests: {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            preferredInspectionDate: Date;
            note: string | null;
        }[];
    } & {
        status: string;
        name: string;
        phoneLast6: string;
        id: string;
        passwordHash: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        leaseStartDate: Date;
        leaseDurationMonths: number;
        checkOutDate: Date | null;
    }>;
    /**
     * 创建租客（并绑定房间）
     */
    createTenant(data: CreateTenantInput): Promise<{
        tenant: {
            status: string;
            name: string;
            phoneLast6: string;
            id: string;
            passwordHash: string | null;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            leaseStartDate: Date;
            leaseDurationMonths: number;
            checkOutDate: Date | null;
        };
        room: {
            status: string;
            roomNumber: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            rent: number;
            deposit: number;
            wifiPassword: string | null;
            lockPassword: string | null;
        };
    }>;
    /**
     * 更新租客信息
     */
    updateTenant(id: string, data: UpdateTenantInput): Promise<{
        status: string;
        name: string;
        phoneLast6: string;
        id: string;
        passwordHash: string | null;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        leaseStartDate: Date;
        leaseDurationMonths: number;
        checkOutDate: Date | null;
    }>;
    /**
     * 删除租客（解绑房屋）
     */
    deleteTenant(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * 添加租金记录
     */
    addRentRecord(tenantId: string, data: RentRecordInput): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        month: string;
        amount: number;
        paid: boolean;
        paidAt: Date | null;
    }>;
    /**
     * 更新租金记录（缴费）
     */
    updateRentRecord(recordId: string, data: UpdateRentRecordInput): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        month: string;
        amount: number;
        paid: boolean;
        paidAt: Date | null;
    }>;
}
export declare const tenantService: TenantService;
//# sourceMappingURL=tenantService.d.ts.map