"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const index_js_1 = require("./config/index.js");
const errors_js_1 = require("./utils/errors.js");
const auth_js_1 = require("./routes/auth.js");
const rooms_js_1 = require("./routes/rooms.js");
const tenants_js_1 = require("./routes/tenants.js");
const announcements_js_1 = require("./routes/announcements.js");
const stats_js_1 = require("./routes/stats.js");
const upload_js_1 = require("./routes/upload.js");
const repair_js_1 = require("./routes/repair.js");
const checkout_js_1 = require("./routes/checkout.js");
const app = (0, fastify_1.default)({
    logger: true
});
// 注册插件
app.register(helmet_1.default, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
});
app.register(cors_1.default, {
    origin: index_js_1.config.CORS_ORIGIN.split(','),
    credentials: true
});
app.register(rate_limit_1.default, {
    max: 100,
    timeWindow: '1 minute'
});
app.register(multipart_1.default, {
    limits: {
        fileSize: index_js_1.config.MAX_FILE_SIZE
    }
});
// 静态文件服务 (用于访问上传的图片)
app.register(static_1.default, {
    root: path_1.default.resolve(index_js_1.config.UPLOAD_DIR),
    prefix: '/uploads/',
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
});
// 注册路由
app.register(auth_js_1.authRoutes, { prefix: '/api/auth' });
app.register(rooms_js_1.roomRoutes, { prefix: '/api/rooms' });
app.register(tenants_js_1.tenantRoutes, { prefix: '/api/tenants' });
app.register(announcements_js_1.announcementRoutes, { prefix: '/api/announcements' });
app.register(announcements_js_1.moveOutRoutes, { prefix: '/api/move-out-requests' });
app.register(stats_js_1.statsRoutes, { prefix: '/api/stats' });
app.register(upload_js_1.uploadRoutes, { prefix: '/api/upload' });
app.register(repair_js_1.repairRoutes, { prefix: '/api/repair-requests' });
app.register(checkout_js_1.checkoutRoutes, { prefix: '/api/checkout' });
// 全局错误处理
app.setErrorHandler(errors_js_1.errorHandler);
// 启动服务
const start = async () => {
    try {
        await app.listen({ port: index_js_1.config.PORT, host: index_js_1.config.HOST });
        console.log(`Server is running at http://${index_js_1.config.HOST}:${index_js_1.config.PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=app.js.map