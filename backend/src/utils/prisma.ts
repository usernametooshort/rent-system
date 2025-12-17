/**
 * Prisma 数据库客户端
 * 单例模式，确保全局只有一个数据库连接
 */

import { PrismaClient } from '@prisma/client'

// 定义全局变量避免开发时热重载创建多个连接
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}
