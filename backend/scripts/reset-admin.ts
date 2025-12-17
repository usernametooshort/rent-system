
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const newPassword = process.argv[2]

    if (!newPassword) {
        console.error('Usage: npm run reset-admin <new_password>')
        process.exit(1)
    }

    try {
        // 1. 获取所有管理员
        const admins = await prisma.admin.findMany()

        if (admins.length === 0) {
            console.log('No database admins found. Only init-admin (env) might exist.')
            console.log('To reset init-admin, please update your .env file directly.')
            return
        }

        console.log(`Found ${admins.length} admins in database.`)

        // 2. 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 3. 更新所有管理员密码 (或者可以指定用户名，这里为了救急简单粗暴全都重置)
        // 既然是救急，我们假设用户只想恢复访问权限
        // 但为安全起见，我们只重置第一个找到的 admin，或者要求指定用户名
        // 让我们稍微优化一下：如果只传密码，重置所有；如果传用户名+密码，只重置特定
        // 简单版：重置已知的 admin 表里的记录

        const updateResult = await prisma.admin.updateMany({
            data: {
                passwordHash: hashedPassword
            }
        })

        console.log(`Successfully reset password for ${updateResult.count} admins.`)
        console.log('New password is:', newPassword)

    } catch (error) {
        console.error('Error resetting password:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
