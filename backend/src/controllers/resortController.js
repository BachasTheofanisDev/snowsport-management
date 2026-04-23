const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

// Δημιουργία Χιονοδρομικού Κέντρου
const createResort = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const existing = await prisma.resort.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Υπάρχει ήδη χρήστης με αυτό το email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resort = await prisma.resort.create({
      data: { name, email, password: hashedPassword, phone }
    });

    const { password: _, ...resortWithoutPassword } = resort;
    res.status(201).json(resortWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Λίστα όλων των σχολών
const getSchools = async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      where: { resortId: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true, isActive: true
      }
    });
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Απενεργοποίηση/Ενεργοποίηση σχολής
const toggleSchool = async (req, res) => {
  try {
    const school = await prisma.school.findFirst({
      where: { id: req.params.id, resortId: req.user.id }
    })

    if (!school) {
      return res.status(404).json({ error: 'Η σχολή δεν βρέθηκε' })
    }

    const updated = await prisma.school.update({
      where: { id: req.params.id },
      data: { isActive: !school.isActive }
    })

    const { password: _, ...schoolWithoutPassword } = updated
    res.json(schoolWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Διαγραφή σχολής
const deleteSchool = async (req, res) => {
  try {
    const school = await prisma.school.findFirst({
      where: { id: req.params.id, resortId: req.user.id }
    })

    if (!school) {
      return res.status(404).json({ error: 'Η σχολή δεν βρέθηκε' })
    }

    await prisma.school.delete({ where: { id: req.params.id } })
    res.json({ message: 'Η σχολή διαγράφηκε επιτυχώς' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { createResort, getSchools, toggleSchool, deleteSchool }