/**
 * 应用配置模块
 * 从环境变量加载配置，提供类型安全的配置访问
 */
export declare const config: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_EXPIRES: string;
    REFRESH_TOKEN_EXPIRES: string;
    PORT: number;
    HOST: string;
    UPLOAD_DIR: string;
    MAX_FILE_SIZE: number;
    CORS_ORIGIN: string;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD: string;
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map