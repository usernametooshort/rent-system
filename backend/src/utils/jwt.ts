/**
 * JWT 工具模块
 * 提供 token 生成和验证功能
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { JWTPayload, Role } from '../types/index.js'

// 解析时间字符串为秒
const parseExpiration = (exp: string): number => {
    const match = exp.match(/^(\d+)([smhd])$/)
    if (!match) return 900 // 默认 15 分钟

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
        case 's': return value
        case 'm': return value * 60
        case 'h': return value * 3600
        case 'd': return value * 86400
        default: return 900
    }
}

interface TokenPayload {
    sub: string
    role: Role
    roomId?: string
    name?: string
}

/**
 * 生成 Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(
        {
            ...payload,
            type: 'access',
        },
        config.JWT_SECRET,
        {
            expiresIn: parseExpiration(config.ACCESS_TOKEN_EXPIRES),
        }
    )
}

/**
 * 生成 Refresh Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(
        {
            sub: payload.sub,
            role: payload.role,
            type: 'refresh',
        },
        config.JWT_REFRESH_SECRET,
        {
            expiresIn: parseExpiration(config.REFRESH_TOKEN_EXPIRES),
        }
    )
}

/**
 * 验证 Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload
}

/**
 * 验证 Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as JWTPayload
}

/**
 * 生成 Token 对（access + refresh）
 */
export const generateTokenPair = (payload: TokenPayload): {
    accessToken: string
    refreshToken: string
} => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    }
}
