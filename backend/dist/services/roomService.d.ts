import { CreateRoomInput, UpdateRoomInput, AddApplianceInput, RoomQueryInput } from '../schemas/room.js';
export declare class RoomService {
    /**
     * 获取房间列表
     */
    getRooms(query: RoomQueryInput): Promise<{
        items: ({
            tenant: {
                name: string;
                id: string;
                leaseStartDate: Date;
            } | null;
            appliances: {
                roomId: string;
                name: string;
                id: string;
                compensationPrice: number;
            }[];
            images: {
                roomId: string;
                id: string;
                createdAt: Date;
                url: string;
                order: number;
            }[];
        } & {
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取房间详情
     */
    getRoomById(id: string): Promise<{
        tenant: ({
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
        }) | null;
        appliances: {
            roomId: string;
            name: string;
            id: string;
            compensationPrice: number;
        }[];
        images: {
            roomId: string;
            id: string;
            createdAt: Date;
            url: string;
            order: number;
        }[];
    } & {
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
    }>;
    /**
     * 创建房间
     */
    createRoom(data: CreateRoomInput): Promise<{
        appliances: {
            roomId: string;
            name: string;
            id: string;
            compensationPrice: number;
        }[];
    } & {
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
    }>;
    /**
     * 更新房间
     */
    updateRoom(id: string, data: UpdateRoomInput): Promise<{
        appliances: {
            roomId: string;
            name: string;
            id: string;
            compensationPrice: number;
        }[];
        images: {
            roomId: string;
            id: string;
            createdAt: Date;
            url: string;
            order: number;
        }[];
    } & {
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
    }>;
    /**
     * 删除房间
     */
    deleteRoom(id: string): Promise<{
        id: string;
    }>;
    /**
     * 添加家电
     */
    addAppliance(roomId: string, data: AddApplianceInput): Promise<{
        roomId: string;
        name: string;
        id: string;
        compensationPrice: number;
    }>;
    /**
     * 删除家电
     */
    deleteAppliance(roomId: string, applianceId: string): Promise<{
        id: string;
    }>;
}
export declare const roomService: RoomService;
//# sourceMappingURL=roomService.d.ts.map