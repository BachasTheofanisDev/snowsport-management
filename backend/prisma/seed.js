const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...')

    // Καθαρισμός βάσης
    await prisma.booking.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.instructor.deleteMany()
    await prisma.school.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.resort.deleteMany()

    // Resort
    const resort = await prisma.resort.create({
        data: {
            name: 'Χιονοδρομικό Κέντρο Καλαβρύτων',
            email: 'admin@kalavritaskiresort.gr',
            password: await bcrypt.hash('kalavrita', 10),
            phone: '2692024451'
        }
    })
    console.log('✅ Resort created:', resort.name)

    // Σχολές
    const school1 = await prisma.school.create({
        data: {
            name: 'Kalavrita Ski Academy',
            email: 'academy@kalavrita.gr',
            password: await bcrypt.hash('academy123', 10),
            phone: '6975775733',
            resortId: resort.id,
            isActive: true
        }
    })

    const school2 = await prisma.school.create({
        data: {
            name: 'Alpine Ski School',
            email: 'alpine@kalavrita.gr',
            password: await bcrypt.hash('alpine123', 10),
            phone: '6975123456',
            resortId: resort.id,
            isActive: true
        }
    })
    console.log('✅ Schools created:', school1.name, school2.name)

    // Εκπαιδευτές Σχολής 1
    const instructor1 = await prisma.instructor.create({
        data: {
            name: 'Βασίλης Τσαβαλάς',
            email: 'vasilis@academy.gr',
            password: await bcrypt.hash('vasilis123', 10),
            phone: '6970099374',
            specialty: ['ski'],
            schoolId: school1.id
        }
    })

    const instructor2 = await prisma.instructor.create({
        data: {
            name: 'Αλεξάνδρα Παπαδοπούλου',
            email: 'alexandra@academy.gr',
            password: await bcrypt.hash('alexandra123', 10),
            phone: '6971234567',
            specialty: ['ski', 'snowboard'],
            schoolId: school1.id
        }
    })

    const instructor3 = await prisma.instructor.create({
        data: {
            name: 'Γεώργιος Μπαχάς',
            email: 'giorgos@academy.gr',
            password: await bcrypt.hash('giorgos123', 10),
            phone: '6972345678',
            specialty: ['snowboard'],
            schoolId: school1.id
        }
    })

    // Εκπαιδευτές Σχολής 2
    const instructor4 = await prisma.instructor.create({
        data: {
            name: 'Μαρία Νικολάου',
            email: 'maria@alpine.gr',
            password: await bcrypt.hash('maria123', 10),
            phone: '6973456789',
            specialty: ['ski'],
            schoolId: school2.id
        }
    })

    const instructor5 = await prisma.instructor.create({
        data: {
            name: 'Νίκος Παπαδόπουλος',
            email: 'nikos@alpine.gr',
            password: await bcrypt.hash('nikos123', 10),
            phone: '6974567890',
            specialty: ['ski', 'snowboard'],
            schoolId: school2.id
        }
    })
    console.log('✅ Instructors created')

    // Πελάτες
    const customer1 = await prisma.customer.create({
        data: {
            name: 'Γιώργος Παπαδόπουλος',
            email: 'giorgospapadopoulos@gmail.com',
            password: await bcrypt.hash('giorgos123', 10),
            phone: '6975111222'
        }
    })

    const customer2 = await prisma.customer.create({
        data: {
            name: 'Μαρία Ιωάννου',
            email: 'maria@gmail.com',
            password: await bcrypt.hash('maria123', 10),
            phone: '6976222333'
        }
    })
    console.log('✅ Customers created')

    console.log('\n🎉 Seeding completed!')
    console.log('\n📋 Στοιχεία σύνδεσης:')
    console.log('─────────────────────────────────')
    console.log('🏔 Resort:')
    console.log('   Email: admin@kalavritaskiresort.gr')
    console.log('   Password: kalavrita')
    console.log('─────────────────────────────────')
    console.log('🎿 Σχολή 1 (Kalavrita Ski Academy):')
    console.log('   Email: academy@kalavrita.gr')
    console.log('   Password: academy123')
    console.log('─────────────────────────────────')
    console.log('🎿 Σχολή 2 (Alpine Ski School):')
    console.log('   Email: alpine@kalavrita.gr')
    console.log('   Password: alpine123')
    console.log('─────────────────────────────────')
    console.log('👨‍🏫 Εκπαιδευτές Σχολής 1:')
    console.log('   vasilis@academy.gr / vasilis123')
    console.log('   alexandra@academy.gr / alexandra123')
    console.log('   giorgos@academy.gr / giorgos123')
    console.log('─────────────────────────────────')
    console.log('👨‍🏫 Εκπαιδευτές Σχολής 2:')
    console.log('   maria@alpine.gr / maria123')
    console.log('   nikos@alpine.gr / nikos123')
    console.log('─────────────────────────────────')
    console.log('👤 Πελάτες:')
    console.log('   giorgospapadopoulos@gmail.com / giorgos123')
    console.log('   maria@gmail.com / maria123')
    console.log('─────────────────────────────────')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })