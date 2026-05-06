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

module.exports = { createInstructor, getLessons, getMyReviews }