const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

// Δημιουργία Σχολής (από Resort)
const createSchool = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const existing = await prisma.school.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Υπάρχει ήδη σχολή με αυτό το email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const school = await prisma.school.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        resortId: req.user.id
      }
    });

    const { password: _, ...schoolWithoutPassword } = school;
    res.status(201).json(schoolWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Λίστα εκπαιδευτών της σχολής
const getInstructors = async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany({
      where: { schoolId: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, specialty: true, createdAt: true
      }
    });
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createSchool, getInstructors };