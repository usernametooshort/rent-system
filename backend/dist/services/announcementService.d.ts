import { CreateAnnouncementInput, UpdateAnnouncementInput, CreateMoveOutRequestInput, UpdateMoveOutRequestInput, AnnouncementQueryInput, MoveOutRequestQueryInput } from '../schemas/announcement.js';
export declare class AnnouncementService {
    /**
     * 获取公告列表
     */
    getAnnouncements(query: AnnouncementQueryInput): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            title: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 创建公告
     */
    createAnnouncement(data: CreateAnnouncementInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
    }>;
    /**
     * 删除公告
     */
    deleteAnnouncement(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * 更新公告
     */
    updateAnnouncement(id: string, data: UpdateAnnouncementInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
    }>;
}
export declare class MoveOutService {
    /**
     * 获取退租申请列表
     */
    getRequests(query: MoveOutRequestQueryInput): Promise<{
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
        } & {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            preferredInspectionDate: Date;
            note: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取租客自己的申请
     */
    getMyRequests(tenantId: string): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        preferredInspectionDate: Date;
        note: string | null;
    }[]>;
    /**
     * 提交退租申请
     */
    createRequest(tenantId: string, data: CreateMoveOutRequestInput): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        preferredInspectionDate: Date;
        note: string | null;
    }>;
    /**
     * 审批退租申请
     */
    processRequest(id: string, data: UpdateMoveOutRequestInput): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        preferredInspectionDate: Date;
        note: string | null;
    }>;
}
export declare const announcementService: AnnouncementService;
export declare const moveOutService: MoveOutService;
//# sourceMappingURL=announcementService.d.ts.map