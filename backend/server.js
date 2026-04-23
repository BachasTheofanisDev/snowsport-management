const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./src/prisma/client');
const authRoutes = require('./src/routes/auth');
const resortRoutes = require('./src/routes/resort');
const schoolRoutes = require('./src/routes/school');
const instructorRoutes = require('./src/routes/instructor');
const lessonRoutes = require('./src/routes/lesson');
const customerRoutes = require('./src/routes/customer')

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resort', resortRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/customer', customerRoutes)

// Test route
app.get('/', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: 'Snowsport Management API is running! 🏔', database: 'Connected ✅' });
  } catch (error) {
    res.json({ message: 'API running but database error ❌', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});