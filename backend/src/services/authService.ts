import { prisma } from '../utils/prisma.js'
import {
    UnauthorizedError,
    ConflictError,
    NotFoundError
} from '../utils/errors.js'
import {
    generateTokenPair,
    generateAccessToken,
    verifyRefreshToken
} from '../utils/jwt.js'
import {
    AdminLoginInput,
    TenantLoginInput,
    RefreshTokenInput
} from '../schemas/auth.js'
import bcrypt from 'bcryptjs'
import { config } from '../config/index.js'

export class AuthService {
    /**
     * 管理员登录
     */
    async adminLogin(input: AdminLoginInput) {
        // 检查是否是初始管理员账号
        if (
            input.username === config.ADMIN_USERNAME &&
            input.password === config.ADMIN_PASSWORD
        ) {
            // 检查数据库中是否已存在管理员
            const existingAdmin = await prisma.admin.findUnique({
                where: { username: input.username }
            })

            let adminId = 'init-admin'

            // 如果不存在，自动创建一个
            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash(input.password, 10)
                const newAdmin = await prisma.admin.create({
                    data: {
                        username: input.username,
                        passwordHash: hashedPassword
                    }
                })
                adminId = newAdmin.id
            } else {
                adminId = existingAdmin.id
                // 验证数据库密码
                const isValid = await bcrypt.compare(input.password, existingAdmin.passwordHash)
                if (!isValid) {
                    throw new UnauthorizedError('用户名或密码错误')
                }
            }

            const tokens = generateTokenPair({
                sub: adminId,
                role: 'admin'
            })

            return {
                ...tokens,
                user: {
                    id: adminId,
                    username: input.username,
                    role: 'admin'
                }
            }
        }

        // 普通管理员登录逻辑（如果有多个管理员）
        const admin = await prisma.admin.findUnique({
            where: { username: input.username }
        })

        if (!admin || !(await bcrypt.compare(input.password, admin.passwordHash))) {
            throw new UnauthorizedError('用户名或密码错误')
        }

        const tokens = generateTokenPair({
            sub: admin.id,
            role: 'admin'
        })

        return {
            ...tokens,
            user: {
                id: admin.id,
                username: admin.username,
                role: 'admin'
            }
        }
    }

    /**
     * 租客登录
     * 验证：姓名 + 房间号 + 手机后6位
     */
    async tenantLogin(input: TenantLoginInput) {
        // 模拟耗时操作，防止时序攻击
        const startTime = Date.now()

        try {
            // 1. 查找租客
            // 先只根据房间号查找房间，确保房间存在且已租
            const room = await prisma.room.findUnique({
                where: { roomNumber: input.roomNumber },
                include: { tenant: true }
            })

            if (!room || !room.tenant) {
                throw new UnauthorizedError('登录信息不匹配')
            }

            const tenant = room.tenant

            // 2. 验证姓名和手机后6位
            // 注意：这里做大小写不敏感比较即可是比较好的体验，但姓名通常严格匹配
            // 手机号后6位匹配
            const phoneLast6 = tenant.phone.slice(-6)

            if (
                tenant.name !== input.name ||
                phoneLast6 !== input.phoneLast6
            ) {
                throw new UnauthorizedError('登录信息不匹配')
            }

            // 3. 生成 Token
            const tokens = generateTokenPair({
                sub: tenant.id,
                role: 'tenant',
                roomId: room.id,
                name: tenant.name
            })

            return {
                ...tokens,
                user: {
                    id: tenant.id,
                    name: tenant.name,
                    role: 'tenant',
                    roomId: room.id,
                    roomNumber: room.roomNumber
                }
            }

        } finally {
            // 确保至少经过 500ms，防止快速爆破
            const elapsed = Date.now() - startTime
            if (elapsed < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsed))
            }
        }
    }

    /**
     * 刷新 Token
     */
    async refreshToken(input: RefreshTokenInput) {
        try {
            const payload = verifyRefreshToken(input.refreshToken)

            // 检查用户是否仍存在
            if (payload.role === 'admin') {
                const admin = await prisma.admin.findUnique({ where: { id: payload.sub } })
                // 特殊处理初始管理员
                if (!admin && payload.sub !== 'init-admin') throw new UnauthorizedError()
            } else {
                const tenant = await prisma.tenant.findUnique({ where: { id: payload.sub } })
                if (!tenant) throw new UnauthorizedError()
            }

            const accessToken = generateAccessToken({
                sub: payload.sub,
                role: payload.role,
                roomId: payload.roomId,
                name: payload.name
            })

            return { accessToken }
        } catch {
            throw new UnauthorizedError('Refresh token 无效或已过期')
        }
    }
}

export const authService = new AuthService()
