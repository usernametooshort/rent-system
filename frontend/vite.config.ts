import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0', // 允许外部访问
        proxy: {
            '/api': {
                target: 'http://backend:3000', // Docker 环境下的 backend 服务名
                changeOrigin: true,
                // 开发环境下如果没用 Docker，可以手动改为 localhost:3000
                // 或者通过环境变量控制
                rewrite: (path) => path // 保持 /api 前缀，因为后端 routes 注册时通常有 prefix
            },
            '/uploads': {
                target: 'http://backend:3000',
                changeOrigin: true,
            },
        },
    },
})
