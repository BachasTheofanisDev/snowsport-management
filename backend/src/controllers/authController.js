const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const generateToken = (user, role) => {
  return jwt.sign(
    { id: user.id, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Login για όλους τους ρόλους
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Ψάχνουμε σε όλους τους πίνακες
    let user = await prisma.resort.findUnique({ where: { email } });
    let role = 'resort';

    if (!user) {
      user = await prisma.school.findUnique({ where: { email } })
      if (user && !user.isActive) {
        return res.status(403).json({ error: 'Ο λογαριασμός σας έχει απενεργοποιηθεί' })
      }
      role = 'school'
    }

    if (!user) {
      user = await prisma.instructor.findUnique({ where: { email } });
      role = 'instructor';
    }

    if (!user) {
      user = await prisma.customer.findUnique({ where: { email } });
      role = 'customer';
    }

    if (!user) {
      return res.status(404).json({ error: 'Ο χρήστης δεν βρέθηκε' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Λάθος κωδικός' });
    }

    const token = generateToken(user, role);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword, role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login };