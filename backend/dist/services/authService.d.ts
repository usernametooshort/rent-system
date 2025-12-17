import { AdminLoginInput, TenantLoginInput, RefreshTokenInput, ChangePasswordInput, ResetTenantPasswordInput, CreateAdminInput, UpdateAdminProfileInput } from '../schemas/auth.js';
export declare class AuthService {
    /**
     * 管理员登录
     */
    adminLogin(input: AdminLoginInput): Promise<{
        user: {
            id: string;
            username: string;
            role: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * 租客登录
     * 验证：姓名 + 房间号 + 手机后6位
     * TODO: 支持密码登录
     */
    tenantLogin(input: TenantLoginInput): Promise<{
        user: {
            id: string;
            name: string;
            role: string;
            roomId: string;
            roomNumber: string;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * 刷新 Token
     */
    refreshToken(input: RefreshTokenInput): Promise<{
        accessToken: string;
    }>;
    /**
     * 修改密码
     */
    changePassword(userId: string, input: ChangePasswordInput, role: string): Promise<{
        success: boolean;
    }>;
    /**
     * 重置租客密码 (房东操作)
     */
    resetTenantPassword(tenantId: string, input: ResetTenantPasswordInput): Promise<{
        success: boolean;
    }>;
    /**
     * 创建管理员
     */
    createAdmin(input: CreateAdminInput): Promise<{
        id: string;
        username: string;
    }>;
    /**
     * 获取所有管理员
     */
    getAdmins(): Promise<{
        username: string;
        id: string;
        createdAt: Date;
    }[]>;
    /**
     * 删除管理员
     */
    deleteAdmin(adminId: string, currentAdminId: string): Promise<{
        success: boolean;
    }>;
    /**
     * 更新管理员资料 (改名)
     */
    /**
     * 更新管理员资料 (改名)
     */
    updateAdminProfile(adminId: string, input: UpdateAdminProfileInput): Promise<{
        id: string;
        username: string;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map