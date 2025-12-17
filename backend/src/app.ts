import fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import { config } from './config/index.js'
import { errorHandler } from './utils/errors.js'
import { authRoutes } from './routes/auth.js'
import { roomRoutes } from './routes/rooms.js'
import { tenantRoutes } from './routes/tenants.js'
import { announcementRoutes, moveOutRoutes } from './routes/announcements.js'
import { statsRoutes } from './routes/stats.js'
import { uploadRoutes } from './routes/upload.js'
import { repairRoutes } from './routes/repair.js'
import { checkoutRoutes } from './routes/checkout.js'

const app = fastify({
    logger: true
})

// 注册插件
app.register(helmet)
app.register(cors, {
    origin: config.CORS_ORIGIN.split(','),
    credentials: true
})
app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
})
app.register(multipart, {
    limits: {
        fileSize: config.MAX_FILE_SIZE
    }
})

// 静态文件服务 (用于访问上传的图片)
app.register(fastifyStatic, {
    root: path.resolve(config.UPLOAD_DIR),
    prefix: '/uploads/',
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    }
})

// 注册路由
app.register(authRoutes, { prefix: '/api/auth' })
app.register(roomRoutes, { prefix: '/api/rooms' })
app.register(tenantRoutes, { prefix: '/api/tenants' })
app.register(announcementRoutes, { prefix: '/api/announcements' })
app.register(moveOutRoutes, { prefix: '/api/move-out-requests' })
app.register(statsRoutes, { prefix: '/api/stats' })
app.register(uploadRoutes, { prefix: '/api/upload' })
app.register(repairRoutes, { prefix: '/api/repair-requests' })
app.register(checkoutRoutes, { prefix: '/api/checkout' })

// 全局错误处理
app.setErrorHandler(errorHandler)

// 启动服务
const start = async () => {
    try {
        await app.listen({ port: config.PORT, host: config.HOST })
        console.log(`Server is running at http://${config.HOST}:${config.PORT}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
