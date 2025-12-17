import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. 创建默认管理员
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPassword
        }
    })
    console.log('Admin created:', admin.username)

    // 2. 创建一些示例家电
    const room101 = await prisma.room.upsert({
        where: { roomNumber: '101' },
        update: {},
        create: {
            roomNumber: '101',
            rent: 2000,
            deposit: 2000,
            status: 'vacant',
            appliances: {
                create: [
                    { name: '空调', compensationPrice: 3000 },
                    { name: '洗衣机', compensationPrice: 1500 },
                    { name: '热水器', compensationPrice: 1000 }
                ]
            }
        }
    })
    console.log('Room created:', room101.roomNumber)

    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
