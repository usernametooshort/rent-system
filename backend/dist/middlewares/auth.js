"use strict";
/**
 * 认证中间件
 * 验证 JWT token 并提取用户信息
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const errors_js_1 = require("../utils/errors.js");
/**
 * JWT 认证中间件
 * 从 Authorization header 中提取并验证 token
 */
const authenticate = async (request, _reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errors_js_1.UnauthorizedError('缺少认证令牌');
    }
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    try {
        const payload = (0, jwt_js_1.verifyAccessToken)(token);
        // 验证 token 类型
        if (payload.type !== 'access') {
            throw new errors_js_1.UnauthorizedError('无效的令牌类型');
        }
        // 将用户信息附加到请求对象
        request.user = payload;
    }
    catch (error) {
        if (error instanceof errors_js_1.UnauthorizedError) {
            throw error;
        }
        throw new errors_js_1.UnauthorizedError('令牌无效或已过期');
    }
};
exports.authenticate = authenticate;
/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续处理（用于游客模式）
 */
const optionalAuthenticate = async (request, _reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 游客模式，不设置 user
        return;
    }
    const token = authHeader.substring(7);
    try {
        const payload = (0, jwt_js_1.verifyAccessToken)(token);
        if (payload.type === 'access') {
            request.user = payload;
        }
    }
    catch {
        // token 无效时静默忽略，作为游客处理
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.js.map