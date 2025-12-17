"use strict";
/**
 * JWT 工具模块
 * 提供 token 生成和验证功能
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenPair = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
// 解析时间字符串为秒
const parseExpiration = (exp) => {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match)
        return 900; // 默认 15 分钟
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 900;
    }
};
/**
 * 生成 Access Token
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign({
        ...payload,
        type: 'access',
    }, index_js_1.config.JWT_SECRET, {
        expiresIn: parseExpiration(index_js_1.config.ACCESS_TOKEN_EXPIRES),
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * 生成 Refresh Token
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign({
        sub: payload.sub,
        role: payload.role,
        type: 'refresh',
    }, index_js_1.config.JWT_REFRESH_SECRET, {
        expiresIn: parseExpiration(index_js_1.config.REFRESH_TOKEN_EXPIRES),
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * 验证 Access Token
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, index_js_1.config.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * 验证 Refresh Token
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, index_js_1.config.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * 生成 Token 对（access + refresh）
 */
const generateTokenPair = (payload) => {
    return {
        accessToken: (0, exports.generateAccessToken)(payload),
        refreshToken: (0, exports.generateRefreshToken)(payload),
    };
};
exports.generateTokenPair = generateTokenPair;
//# sourceMappingURL=jwt.js.map