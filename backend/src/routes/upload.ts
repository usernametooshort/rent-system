import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/auth.js'
import { adminOnly } from '../middlewares/rbac.js'
import { prisma } from '../utils/prisma.js'
import { config } from '../config/index.js'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'
import { ValidationError } from '../utils/errors.js'

export async function uploadRoutes(fastify: FastifyInstance) {
    // 确保上传目录存在
    if (!fs.existsSync(config.UPLOAD_DIR)) {
        fs.mkdirSync(config.UPLOAD_DIR, { recursive: true })
    }

    // 上传房屋图片 (管理员)
    fastify.post('/room-image', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const data = await request.file()

        if (!data) {
            throw new ValidationError('请选择文件')
        }

        // 简单验证 mime type
        if (!data.mimetype.startsWith('image/')) {
            throw new ValidationError('仅支持图片文件')
        }

        // 获取 roomId (从 fields 中)
        // fastify-multipart 将非文件字段放在 data.fields 中，但 API 稍微复杂
        // 这里简化：要求 multipart field 名为 'file'，roomId 作为 query 参数或 header
        // 或者我们直接从 parts 中读取。
        // 为了简单，我们让客户端通过 query 传递 roomId
        const query = request.query as { roomId: string }
        if (!query.roomId) {
            throw new ValidationError('缺少 roomId 参数')
        }

        // 检查房间是否存在
        const room = await prisma.room.findUnique({ where: { id: query.roomId } })
        if (!room) {
            throw new ValidationError('房间不存在')
        }

        // 生成文件名
        const ext = path.extname(data.filename)
        const filename = `${randomUUID()}${ext}`
        const filepath = path.join(config.UPLOAD_DIR, filename)

        // 保存文件
        await pipeline(data.file, fs.createWriteStream(filepath))

        // 保存到数据库
        const image = await prisma.roomImage.create({
            data: {
                roomId: query.roomId,
                url: `/uploads/${filename}`,
                order: 0 // 默认顺序
            }
        })

        reply.send({ success: true, data: image })
    })

    // 删除图片 (管理员)
    fastify.delete('/room-image/:id', {
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params as { id: string }

        const image = await prisma.roomImage.findUnique({ where: { id } })
        if (!image) throw new ValidationError('图片不存在')

        // 删除数据库记录
        await prisma.roomImage.delete({ where: { id } })

        // 删除文件
        const filename = path.basename(image.url)
        const filepath = path.join(config.UPLOAD_DIR, filename)

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }

        reply.send({ success: true })
    })

    // 通用图片上传 (已登录用户均可使用 - 用于报修图片等)
    fastify.post('/image', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const data = await request.file()

        if (!data) {
            throw new ValidationError('请选择文件')
        }

        if (!data.mimetype.startsWith('image/')) {
            throw new ValidationError('仅支持图片文件')
        }

        // 生成文件名
        const ext = path.extname(data.filename)
        const filename = `${randomUUID()}${ext}`
        const filepath = path.join(config.UPLOAD_DIR, filename)

        // 保存文件
        await pipeline(data.file, fs.createWriteStream(filepath))

        // 返回 URL (不需要关联数据库记录)
        reply.send({
            success: true,
            data: {
                url: `/uploads/${filename}`
            }
        })
    })
}
