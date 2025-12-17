/**
 * JWT 工具模块
 * 提供 token 生成和验证功能
 */
import { JWTPayload, Role } from '../types/index.js';
interface TokenPayload {
    sub: string;
    role: Role;
    roomId?: string;
    name?: string;
}
/**
 * 生成 Access Token
 */
export declare const generateAccessToken: (payload: TokenPayload) => string;
/**
 * 生成 Refresh Token
 */
export declare const generateRefreshToken: (payload: TokenPayload) => string;
/**
 * 验证 Access Token
 */
export declare const verifyAccessToken: (token: string) => JWTPayload;
/**
 * 验证 Refresh Token
 */
export declare const verifyRefreshToken: (token: string) => JWTPayload;
/**
 * 生成 Token 对（access + refresh）
 */
export declare const generateTokenPair: (payload: TokenPayload) => {
    accessToken: string;
    refreshToken: string;
};
export {};
//# sourceMappingURL=jwt.d.ts.map