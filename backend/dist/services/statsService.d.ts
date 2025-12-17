export declare class StatsService {
    /**
     * 获取租客缴费状态统计
     */
    getRentStatus(): Promise<{
        month: string;
        summary: {
            totalTenants: number;
            paidCount: number;
            unpaidCount: number;
            totalExpected: number;
            totalCollected: number;
            completionRate: number;
        };
        unpaid: {
            id: string;
            name: string;
            roomNumber: string | undefined;
            amount: number;
        }[];
        paid: {
            id: string;
            name: string;
            roomNumber: string | undefined;
            amount: number;
            paidAt: Date | null;
        }[];
    }>;
    /**
     * 获取月度收入统计（最近12个月）
     */
    getMonthlyIncome(): Promise<{
        month: string;
        amount: number;
    }[]>;
}
export declare const statsService: StatsService;
//# sourceMappingURL=statsService.d.ts.map