const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    const existing = await prisma.superAdmin.findUnique({
        where: { email: 'superadmin@snowsport.gr' }
    })

    if (existing) {
        console.log('Super Admin already exists!')
        return
    }

    const superAdmin = await prisma.superAdmin.create({
        data: {
            name: 'Super Admin',
            email: 'superadmin@snowsport.gr',
            password: await bcrypt.hash('superadmin123', 10)
        }
    })

    console.log('✅ Super Admin created!')
    console.log('   Email: superadmin@snowsport.gr')
    console.log('   Password: superadmin123')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })