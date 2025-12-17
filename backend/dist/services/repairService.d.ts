interface CreateRepairInput {
    title: string;
    description: string;
    imageUrls?: string[];
}
interface UpdateRepairInput {
    status: 'pending' | 'processing' | 'completed';
    note?: string;
}
interface RepairQueryInput {
    page?: number;
    limit?: number;
    status?: string;
}
export declare class RepairService {
    /**
     * 获取报修列表 (管理员)
     */
    getRequests(query: RepairQueryInput): Promise<{
        items: ({
            tenant: {
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
            };
            images: {
                id: string;
                createdAt: Date;
                url: string;
                repairId: string;
            }[];
        } & {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            note: string | null;
            title: string;
            description: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取租客自己的报修
     */
    getMyRequests(tenantId: string): Promise<({
        images: {
            id: string;
            createdAt: Date;
            url: string;
            repairId: string;
        }[];
    } & {
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        note: string | null;
        title: string;
        description: string;
    })[]>;
    /**
     * 提交报修（支持图片）
     */
    createRequest(tenantId: string, data: CreateRepairInput): Promise<({
        images: {
            id: string;
            createdAt: Date;
            url: string;
            repairId: string;
        }[];
    } & {
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        note: string | null;
        title: string;
        description: string;
    }) | null>;
    /**
     * 处理报修
     */
    processRequest(id: string, data: UpdateRepairInput): Promise<{
        images: {
            id: string;
            createdAt: Date;
            url: string;
            repairId: string;
        }[];
    } & {
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        note: string | null;
        title: string;
        description: string;
    }>;
}
export declare const repairService: RepairService;
export {};
//# sourceMappingURL=repairService.d.ts.map