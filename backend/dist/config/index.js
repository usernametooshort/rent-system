"use strict";
/**
 * 应用配置模块
 * 从环境变量加载配置，提供类型安全的配置访问
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
// 配置 Schema 验证
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().default('file:./data/rent.db'),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    ACCESS_TOKEN_EXPIRES: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_EXPIRES: zod_1.z.string().default('7d'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    HOST: zod_1.z.string().default('0.0.0.0'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('20971520'),
    CORS_ORIGIN: zod_1.z.string().default('https://rent-system.pages.dev,http://localhost:5173,http://localhost:8280'),
    ADMIN_USERNAME: zod_1.z.string().default('admin'),
    ADMIN_PASSWORD: zod_1.z.string().default('admin123'),
});
// 解析环境变量
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ 环境变量验证失败:');
        console.error(result.error.format());
        process.exit(1);
    }
    return result.data;
};
exports.config = parseEnv();
//# sourceMappingURL=index.js.map