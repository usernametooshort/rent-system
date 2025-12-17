interface DeductionItem {
    name: string;
    amount: number;
}
interface ApplianceCheckItem {
    name: string;
    ok: boolean;
    note?: string;
}
interface CheckoutInput {
    roomId: string;
    depositRefunded: number;
    deductions?: DeductionItem[];
    keyReturned: boolean;
    applianceCheckResult?: ApplianceCheckItem[];
    note?: string;
}
export declare class CheckoutService {
    /**
     * 处理退租
     * 1. 记录退租信息
     * 2. 归档租客 (Soft Delete)
     * 3. 更新房间状态为空置
     */
    processCheckout(input: CheckoutInput): Promise<{
        roomNumber: string;
        id: string;
        note: string | null;
        depositRefunded: number;
        deductions: string | null;
        keyReturned: boolean;
        applianceCheckResult: string | null;
        depositAmount: number;
        checkoutDate: Date;
        tenantName: string;
        tenantPhone: string;
    }>;
    /**
     * 获取所有退租记录
     */
    getCheckoutRecords(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            deductions: any;
            applianceCheckResult: any;
            roomNumber: string;
            id: string;
            note: string | null;
            depositRefunded: number;
            keyReturned: boolean;
            depositAmount: number;
            checkoutDate: Date;
            tenantName: string;
            tenantPhone: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * 获取单条退租记录
     */
    getCheckoutRecord(id: string): Promise<{
        deductions: any;
        applianceCheckResult: any;
        roomNumber: string;
        id: string;
        note: string | null;
        depositRefunded: number;
        keyReturned: boolean;
        depositAmount: number;
        checkoutDate: Date;
        tenantName: string;
        tenantPhone: string;
    } | null>;
}
export declare const checkoutService: CheckoutService;
export {};
//# sourceMappingURL=checkoutService.d.ts.map