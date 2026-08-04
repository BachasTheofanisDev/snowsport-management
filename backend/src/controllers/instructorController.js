const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

// Δημιουργία Εκπαιδευτή (από Σχολή)
const createInstructor = async (req, res) => {
  const { name, email, password, phone, specialty } = req.body;

  try {
    const existing = await prisma.instructor.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Υπάρχει ήδη εκπαιδευτής με αυτό το email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const instructor = await prisma.instructor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        specialty,
        schoolId: req.user.id
      }
    });

    const { password: _, ...instructorWithoutPassword } = instructor;
    res.status(201).json(instructorWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Λίστα μαθημάτων εκπαιδευτή
const getLessons = async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { instructorId: req.user.id },
      include: {
        bookings: {
          include: { review: true }
        }
      }
    })
    res.json(lessons)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { instructorId: req.user.id },
      include: {
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Δεν επιλέχθηκε εικόνα' })
    }
    const imagePath = `/uploads/${req.file.filename}`
    const instructor = await prisma.instructor.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    })
    res.json({ image: instructor.image })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getMySchool = async (req, res) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: req.user.id },
      include: {
        school: { select: { id: true, name: true, image: true } }
      }
    })
    res.json(instructor.school)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const getMyStats = async (req, res) => {
  const { dateFrom, dateTo } = req.query
  try {
    const start = dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0,0,0,0))
    const end = dateTo ? new Date(new Date(dateTo).setHours(23,59,59,999)) : new Date(new Date().setHours(23,59,59,999))

    const lessons = await prisma.lesson.findMany({
      where: {
        instructorId: req.user.id,
        date: { gte: start, lte: end },
        status: { not: 'cancelled' }
      }
    })

    const totalLessons = lessons.length
    const individualLessons = lessons.filter(l => l.type !== 'open_group').length
    const groupLessons = lessons.filter(l => l.type === 'open_group').length
    const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0)

    res.json({
      period: { from: start, to: end },
      totalLessons,
      individualLessons,
      groupLessons,
      totalRevenue
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateInfo = async (req, res) => {
  const { description } = req.body
  try {
    const instructor = await prisma.instructor.update({
      where: { id: req.user.id },
      data: { description }
    })
    const { password, ...rest } = instructor
    res.json(rest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { createInstructor, getLessons, getMyReviews, uploadImage, getMySchool, getMyStats, updateInfo };