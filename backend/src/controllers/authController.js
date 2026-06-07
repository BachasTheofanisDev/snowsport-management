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

const findUserByEmail = async (email) => {
  const tables = [
    { model: 'superAdmin', role: 'superadmin' },
    { model: 'resort', role: 'resort' },
    { model: 'school', role: 'school' },
    { model: 'instructor', role: 'instructor' },
    { model: 'customer', role: 'customer' }
  ];

  for (const { model, role } of tables) {
    const user = await prisma[model].findUnique({ where: { email } });
    if (user) return { user, role };
  }
  return { user: null, role: null };
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email και κωδικός είναι υποχρεωτικά' });
  }

  try {
    const { user, role } = await findUserByEmail(email);

    // Generic message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: 'Λάθος email ή κωδικός' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Λάθος email ή κωδικός' });
    }

    // Active-account check happens after credential verification
    if (role === 'school' && !user.isActive) {
      return res.status(403).json({ error: 'Ο λογαριασμός σας έχει απενεργοποιηθεί' });
    }

    const token = generateToken(user, role);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword, role });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
