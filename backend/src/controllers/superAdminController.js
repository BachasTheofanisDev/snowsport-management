const prisma = require('../prisma/client')

// Συνολική επισκόπηση όλου του συστήματος
const getOverview = async (req, res) => {
    try {
        const [resorts, schools, instructors, customers, lessons] = await Promise.all([
            prisma.resort.count(),
            prisma.school.count(),
            prisma.instructor.count(),
            prisma.customer.count(),
            prisma.lesson.count()
        ])

        res.json({ resorts, schools, instructors, customers, lessons })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Λίστα όλων των χιονοδρομικών με τα δεδομένα τους
const getAllResorts = async (req, res) => {
    try {
        const resorts = await prisma.resort.findMany({
            select: {
                id: true, name: true, email: true, phone: true, createdAt: true,
                schools: {
                    select: {
                        id: true, name: true, email: true, isActive: true,
                        instructors: { select: { id: true, name: true } },
                        lessons: { select: { id: true } }
                    }
                }
            }
        })
        res.json(resorts)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Λίστα όλων των πελατών
const getAllCustomers = async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true, name: true, email: true, phone: true, createdAt: true,
                bookings: { select: { id: true } }
            }
        })
        res.json(customers)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Δημιουργία νέου Χιονοδρομικού Κέντρου
const createResort = async (req, res) => {
    const bcrypt = require('bcryptjs')
    const { name, email, password, phone } = req.body

    try {
        const existing = await prisma.resort.findUnique({ where: { email } })
        if (existing) {
            return res.status(400).json({ error: 'Υπάρχει ήδη χιονοδρομικό με αυτό το email' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const resort = await prisma.resort.create({
            data: { name, email, password: hashedPassword, phone }
        })

        const { password: _, ...resortWithoutPassword } = resort
        res.status(201).json(resortWithoutPassword)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Διαγραφή Χιονοδρομικού Κέντρου
const deleteResort = async (req, res) => {
    try {
        await prisma.resort.delete({ where: { id: req.params.id } })
        res.json({ message: 'Το χιονοδρομικό διαγράφηκε' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = { getOverview, getAllResorts, getAllCustomers, createResort, deleteResort }