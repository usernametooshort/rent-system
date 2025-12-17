"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = uploadRoutes;
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
const prisma_js_1 = require("../utils/prisma.js");
const index_js_1 = require("../config/index.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("stream/promises");
const crypto_1 = require("crypto");
const errors_js_1 = require("../utils/errors.js");
async function uploadRoutes(fastify) {
    // 确保上传目录存在
    if (!fs_1.default.existsSync(index_js_1.config.UPLOAD_DIR)) {
        fs_1.default.mkdirSync(index_js_1.config.UPLOAD_DIR, { recursive: true });
    }
    // 上传房屋图片 (管理员)
    fastify.post('/room-image', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            throw new errors_js_1.ValidationError('请选择文件');
        }
        // 简单验证 mime type
        if (!data.mimetype.startsWith('image/')) {
            throw new errors_js_1.ValidationError('仅支持图片文件');
        }
        // 获取 roomId (从 fields 中)
        // fastify-multipart 将非文件字段放在 data.fields 中，但 API 稍微复杂
        // 这里简化：要求 multipart field 名为 'file'，roomId 作为 query 参数或 header
        // 或者我们直接从 parts 中读取。
        // 为了简单，我们让客户端通过 query 传递 roomId
        const query = request.query;
        if (!query.roomId) {
            throw new errors_js_1.ValidationError('缺少 roomId 参数');
        }
        // 检查房间是否存在
        const room = await prisma_js_1.prisma.room.findUnique({ where: { id: query.roomId } });
        if (!room) {
            throw new errors_js_1.ValidationError('房间不存在');
        }
        // 生成文件名
        const ext = path_1.default.extname(data.filename);
        const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const filepath = path_1.default.join(index_js_1.config.UPLOAD_DIR, filename);
        // 保存文件
        await (0, promises_1.pipeline)(data.file, fs_1.default.createWriteStream(filepath));
        // 保存到数据库
        const image = await prisma_js_1.prisma.roomImage.create({
            data: {
                roomId: query.roomId,
                url: `/uploads/${filename}`,
                order: 0 // 默认顺序
            }
        });
        reply.send({ success: true, data: image });
    });
    // 删除图片 (管理员)
    fastify.delete('/room-image/:id', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const { id } = request.params;
        const image = await prisma_js_1.prisma.roomImage.findUnique({ where: { id } });
        if (!image)
            throw new errors_js_1.ValidationError('图片不存在');
        // 删除数据库记录
        await prisma_js_1.prisma.roomImage.delete({ where: { id } });
        // 删除文件
        const filename = path_1.default.basename(image.url);
        const filepath = path_1.default.join(index_js_1.config.UPLOAD_DIR, filename);
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.unlinkSync(filepath);
        }
        reply.send({ success: true });
    });
    // 通用图片上传 (已登录用户均可使用 - 用于报修图片等)
    fastify.post('/image', {
        preHandler: [auth_js_1.authenticate]
    }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            throw new errors_js_1.ValidationError('请选择文件');
        }
        if (!data.mimetype.startsWith('image/')) {
            throw new errors_js_1.ValidationError('仅支持图片文件');
        }
        // 生成文件名
        const ext = path_1.default.extname(data.filename);
        const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
        const filepath = path_1.default.join(index_js_1.config.UPLOAD_DIR, filename);
        // 保存文件
        await (0, promises_1.pipeline)(data.file, fs_1.default.createWriteStream(filepath));
        // 返回 URL (不需要关联数据库记录)
        reply.send({
            success: true,
            data: {
                url: `/uploads/${filename}`
            }
        });
    });
}
//# sourceMappingURL=upload.js.map