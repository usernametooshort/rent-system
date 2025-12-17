"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const jwt_js_1 = require("../utils/jwt.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_js_1 = require("../config/index.js");
class AuthService {
    /**
     * 管理员登录
     */
    async adminLogin(input) {
        // 检查是否是初始管理员账号
        if (input.username === index_js_1.config.ADMIN_USERNAME &&
            input.password === index_js_1.config.ADMIN_PASSWORD) {
            // 检查数据库中是否已存在管理员
            const existingAdmin = await prisma_js_1.prisma.admin.findUnique({
                where: { username: input.username }
            });
            let adminId = 'init-admin';
            // 如果不存在，自动创建一个
            if (!existingAdmin) {
                const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
                const newAdmin = await prisma_js_1.prisma.admin.create({
                    data: {
                        username: input.username,
                        passwordHash: hashedPassword
                    }
                });
                adminId = newAdmin.id;
            }
            else {
                adminId = existingAdmin.id;
                // 验证数据库密码
                const isValid = await bcryptjs_1.default.compare(input.password, existingAdmin.passwordHash);
                if (!isValid) {
                    throw new errors_js_1.UnauthorizedError('用户名或密码错误');
                }
            }
            const tokens = (0, jwt_js_1.generateTokenPair)({
                sub: adminId,
                role: 'admin'
            });
            return {
                ...tokens,
                user: {
                    id: adminId,
                    username: input.username,
                    role: 'admin'
                }
            };
        }
        // 普通管理员登录逻辑（如果有多个管理员）
        const admin = await prisma_js_1.prisma.admin.findUnique({
            where: { username: input.username }
        });
        if (!admin || !(await bcryptjs_1.default.compare(input.password, admin.passwordHash))) {
            throw new errors_js_1.UnauthorizedError('用户名或密码错误');
        }
        const tokens = (0, jwt_js_1.generateTokenPair)({
            sub: admin.id,
            role: 'admin'
        });
        return {
            ...tokens,
            user: {
                id: admin.id,
                username: admin.username,
                role: 'admin'
            }
        };
    }
    /**
     * 租客登录
     * 验证：姓名 + 房间号 + 手机后6位
     * TODO: 支持密码登录
     */
    async tenantLogin(input) {
        // 模拟耗时操作，防止时序攻击
        const startTime = Date.now();
        try {
            // 1. 查找租客
            // 先只根据房间号查找房间，确保房间存在且已租
            const room = await prisma_js_1.prisma.room.findUnique({
                where: { roomNumber: input.roomNumber },
                include: { tenant: true }
            });
            if (!room || !room.tenant) {
                throw new errors_js_1.UnauthorizedError('登录信息不匹配');
            }
            const tenant = room.tenant;
            // 2. 验证姓名和手机后6位
            const phoneLast6 = tenant.phone.slice(-6);
            if (tenant.name !== input.name ||
                phoneLast6 !== input.phoneLast6) {
                throw new errors_js_1.UnauthorizedError('登录信息不匹配');
            }
            // 如果租客已设置密码，这里其实应该优先验证密码。
            // 但目前的 TenantLoginInput 是没有 password 字段的。
            // 为了兼容，我们暂时保持原样，允许如果不改前端登录页，依然可以用旧方式登录。
            // 理想情况下应该根据是否有 passwordHash 来决定流程。
            // 3. 生成 Token
            const tokens = (0, jwt_js_1.generateTokenPair)({
                sub: tenant.id,
                role: 'tenant',
                roomId: room.id,
                name: tenant.name
            });
            return {
                ...tokens,
                user: {
                    id: tenant.id,
                    name: tenant.name,
                    role: 'tenant',
                    roomId: room.id,
                    roomNumber: room.roomNumber
                }
            };
        }
        finally {
            // 确保至少经过 500ms，防止快速爆破
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
            }
        }
    }
    /**
     * 刷新 Token
     */
    async refreshToken(input) {
        try {
            const payload = (0, jwt_js_1.verifyRefreshToken)(input.refreshToken);
            // 检查用户是否仍存在
            if (payload.role === 'admin') {
                const admin = await prisma_js_1.prisma.admin.findUnique({ where: { id: payload.sub } });
                // 特殊处理初始管理员
                if (!admin && payload.sub !== 'init-admin')
                    throw new errors_js_1.UnauthorizedError();
            }
            else {
                const tenant = await prisma_js_1.prisma.tenant.findUnique({ where: { id: payload.sub } });
                if (!tenant)
                    throw new errors_js_1.UnauthorizedError();
            }
            const accessToken = (0, jwt_js_1.generateAccessToken)({
                sub: payload.sub,
                role: payload.role,
                roomId: payload.roomId,
                name: payload.name
            });
            return { accessToken };
        }
        catch {
            throw new errors_js_1.UnauthorizedError('Refresh token 无效或已过期');
        }
    }
    /**
     * 修改密码
     */
    async changePassword(userId, input, role) {
        // 1. 验证旧密码
        let passwordHash = null;
        let initialPassword = ''; // 租客的初始密码（手机后6位）
        if (role === 'admin') {
            const user = await prisma_js_1.prisma.admin.findUnique({ where: { id: userId } });
            if (!user)
                throw new errors_js_1.NotFoundError('用户不存在');
            passwordHash = user.passwordHash;
        }
        else {
            const user = await prisma_js_1.prisma.tenant.findUnique({ where: { id: userId } });
            if (!user)
                throw new errors_js_1.NotFoundError('用户不存在');
            passwordHash = user.passwordHash;
            initialPassword = user.phoneLast6;
        }
        if (passwordHash) {
            const isValid = await bcryptjs_1.default.compare(input.oldPassword, passwordHash);
            if (!isValid)
                throw new errors_js_1.UnauthorizedError('旧密码错误');
        }
        else {
            // 租客如果没有设置过密码，旧密码必须匹配初始密码（手机后6位）
            if (role === 'tenant') {
                if (input.oldPassword !== initialPassword) {
                    throw new errors_js_1.UnauthorizedError('旧密码错误（初始密码为手机后6位）');
                }
            }
            else {
                // Admin 理论上不可能没有 hash
                throw new errors_js_1.UnauthorizedError('账号异常，请联系管理员');
            }
        }
        // 2. 更新新密码
        const newHashedPassword = await bcryptjs_1.default.hash(input.newPassword, 10);
        if (role === 'admin') {
            await prisma_js_1.prisma.admin.update({
                where: { id: userId },
                data: { passwordHash: newHashedPassword }
            });
        }
        else {
            await prisma_js_1.prisma.tenant.update({
                where: { id: userId },
                data: { passwordHash: newHashedPassword }
            });
        }
        return { success: true };
    }
    /**
     * 重置租客密码 (房东操作)
     */
    async resetTenantPassword(tenantId, input) {
        const hashedPassword = await bcryptjs_1.default.hash(input.newPassword, 10);
        await prisma_js_1.prisma.tenant.update({
            where: { id: tenantId },
            data: { passwordHash: hashedPassword }
        });
        return { success: true };
    }
    /**
     * 创建管理员
     */
    async createAdmin(input) {
        const existing = await prisma_js_1.prisma.admin.findUnique({ where: { username: input.username } });
        if (existing)
            throw new errors_js_1.ConflictError('用户名已存在');
        // 不允许创建和初始管理员同名的账号（为了避免混淆）
        if (input.username === index_js_1.config.ADMIN_USERNAME) {
            throw new errors_js_1.ConflictError('该用户名保留，不可创建');
        }
        const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
        const admin = await prisma_js_1.prisma.admin.create({
            data: {
                username: input.username,
                passwordHash: hashedPassword
            }
        });
        return {
            id: admin.id,
            username: admin.username
        };
    }
    /**
     * 获取所有管理员
     */
    async getAdmins() {
        const admins = await prisma_js_1.prisma.admin.findMany({
            select: { id: true, username: true, createdAt: true }
        });
        return admins;
    }
    /**
     * 删除管理员
     */
    async deleteAdmin(adminId, currentAdminId) {
        const admin = await prisma_js_1.prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new errors_js_1.NotFoundError('管理员不存在');
        // 1. 不能删除自己
        if (adminId === currentAdminId)
            throw new errors_js_1.ConflictError('不能删除自己');
        // 2. 不能删除初始管理员 (config defined)
        if (admin.username === index_js_1.config.ADMIN_USERNAME)
            throw new errors_js_1.ConflictError('初始管理员不可删除');
        // 3. 只有初始管理员或者其他超级管理员权限? 目前假设所有管理员平权
        await prisma_js_1.prisma.admin.delete({ where: { id: adminId } });
        return { success: true };
    }
    /**
     * 更新管理员资料 (改名)
     */
    /**
     * 更新管理员资料 (改名)
     */
    async updateAdminProfile(adminId, input) {
        const admin = await prisma_js_1.prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin)
            throw new errors_js_1.NotFoundError('管理员不存在');
        // 保护初始管理员
        if (admin.username === index_js_1.config.ADMIN_USERNAME) {
            throw new errors_js_1.ConflictError('初始管理员账号无法修改用户名 (请在环境变量中修改)');
        }
        // 检查新用户名是否占用
        const existing = await prisma_js_1.prisma.admin.findUnique({ where: { username: input.username } });
        if (existing && existing.id !== adminId)
            throw new errors_js_1.ConflictError('用户名已存在');
        // 再次检查新用户名是否撞了初始管理员
        if (input.username === index_js_1.config.ADMIN_USERNAME)
            throw new errors_js_1.ConflictError('用户名与初始管理员冲突');
        const updated = await prisma_js_1.prisma.admin.update({
            where: { id: adminId },
            data: { username: input.username }
        });
        return {
            id: updated.id,
            username: updated.username
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map