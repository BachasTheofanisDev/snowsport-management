const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./src/routes/auth');
const resortRoutes = require('./src/routes/resort');
const schoolRoutes = require('./src/routes/school');
const instructorRoutes = require('./src/routes/instructor');
const lessonRoutes = require('./src/routes/lesson');
const customerRoutes = require('./src/routes/customer')
const reviewRoutes = require('./src/routes/review')
const errorHandler = require('./src/middleware/errorHandler')
const quizRoutes = require('./src/routes/quiz')
const superAdminRoutes = require('./src/routes/superAdmin')

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resort', resortRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/customer', customerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/quiz', quizRoutes)
app.use('/api/superadmin', superAdminRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Snowsport Management API is running! 🏔' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
