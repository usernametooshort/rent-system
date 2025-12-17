/**
 * 应用配置模块
 * 从环境变量加载配置，提供类型安全的配置访问
 */

import { z } from 'zod'

// 配置 Schema 验证
const envSchema = z.object({
    DATABASE_URL: z.string().default('file:./data/rent.db'),
    JWT_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRES: z.string().default('7d'),
    PORT: z.string().transform(Number).default('3000'),
    HOST: z.string().default('0.0.0.0'),
    UPLOAD_DIR: z.string().default('./uploads'),
    MAX_FILE_SIZE: z.string().transform(Number).default('20971520'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    ADMIN_USERNAME: z.string().default('admin'),
    ADMIN_PASSWORD: z.string().default('admin123'),
})

// 解析环境变量
const parseEnv = () => {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
        console.error('❌ 环境变量验证失败:')
        console.error(result.error.format())
        process.exit(1)
    }
    return result.data
}

export const config = parseEnv()

// 导出类型
export type Config = typeof config
