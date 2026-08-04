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
        id: true, name: true, email: true, phone: true, specialty: true, createdAt: true,
        reviews: { select: { rating: true } }
      }
    });

    // Υπολογισμός μέσου όρου ανά εκπαιδευτή
    const withRatings = instructors.map(i => ({
      id: i.id,
      name: i.name,
      email: i.email,
      phone: i.phone,
      specialty: i.specialty,
      createdAt: i.createdAt,
      avgRating: i.reviews.length > 0
        ? Math.round((i.reviews.reduce((s, r) => s + r.rating, 0) / i.reviews.length) * 10) / 10
        : 0,
      totalReviews: i.reviews.length
    }));

    res.json(withRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Δεν επιλέχθηκε εικόνα' })
    }
    const imagePath = `/uploads/${req.file.filename}`
    const school = await prisma.school.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    })
    res.json({ image: school.image })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ενημέρωση περιγραφής
const updateInfo = async (req, res) => {
  const { description } = req.body
  try {
    const school = await prisma.school.update({
      where: { id: req.user.id },
      data: { description }
    })
    const { password, ...rest } = school
    res.json(rest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Upload φωτογραφιών gallery
const uploadGallery = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Δεν επιλέχθηκαν εικόνες' })
    }
    const newPaths = req.files.map(f => `/uploads/${f.filename}`)
    const school = await prisma.school.findUnique({ where: { id: req.user.id } })
    const updated = await prisma.school.update({
      where: { id: req.user.id },
      data: { gallery: [...school.gallery, ...newPaths] }
    })
    res.json({ gallery: updated.gallery })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Διαγραφή φωτογραφίας από gallery
const deleteGalleryImage = async (req, res) => {
  const { imagePath } = req.body
  try {
    const school = await prisma.school.findUnique({ where: { id: req.user.id } })
    const updated = await prisma.school.update({
      where: { id: req.user.id },
      data: { gallery: school.gallery.filter(img => img !== imagePath) }
    })
    res.json({ gallery: updated.gallery })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ορισμός κύριας φωτογραφίας
const setMainImage = async (req, res) => {
  const { imagePath } = req.body
  try {
    const school = await prisma.school.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    })
    res.json({ image: school.image })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { createSchool, getInstructors, updateInfo, uploadGallery, deleteGalleryImage, setMainImage }