"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = statsRoutes;
const statsService_js_1 = require("../services/statsService.js");
const auth_js_1 = require("../middlewares/auth.js");
const rbac_js_1 = require("../middlewares/rbac.js");
async function statsRoutes(fastify) {
    // 租客缴费状态
    fastify.get('/rent-status', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await statsService_js_1.statsService.getRentStatus();
        reply.send({ success: true, data: result });
    });
    // 月度收入
    fastify.get('/income/monthly', {
        preHandler: [auth_js_1.authenticate, rbac_js_1.adminOnly]
    }, async (request, reply) => {
        const result = await statsService_js_1.statsService.getMonthlyIncome();
        reply.send({ success: true, data: result });
    });
}
//# sourceMappingURL=stats.js.map