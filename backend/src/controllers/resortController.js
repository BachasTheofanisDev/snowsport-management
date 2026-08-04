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

// Upload φωτογραφίας χιονοδρομικού
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Δεν επιλέχθηκε εικόνα' })
    }

    const imagePath = `/uploads/${req.file.filename}`

    const resort = await prisma.resort.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    })

    res.json({ image: resort.image })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const updateInfo = async (req, res) => {
  const {
    description, baseAltitude, peakAltitude, liftsCount, totalSlopeLength,
    slopesGreen, slopesBlue, slopesRed, slopesBlack, location, openingHours, phone
  } = req.body

  try {
    const resort = await prisma.resort.update({
      where: { id: req.user.id },
      data: {
        description,
        baseAltitude: baseAltitude ? parseInt(baseAltitude) : null,
        peakAltitude: peakAltitude ? parseInt(peakAltitude) : null,
        liftsCount: liftsCount ? parseInt(liftsCount) : 0,
        totalSlopeLength: totalSlopeLength ? parseFloat(totalSlopeLength) : null,
        slopesGreen: slopesGreen ? parseInt(slopesGreen) : 0,
        slopesBlue: slopesBlue ? parseInt(slopesBlue) : 0,
        slopesRed: slopesRed ? parseInt(slopesRed) : 0,
        slopesBlack: slopesBlack ? parseInt(slopesBlack) : 0,
        location,
        openingHours,
        phone
      }
    })
    const { password, ...rest } = resort
    res.json(rest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Upload χάρτη
const uploadMap = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Δεν επιλέχθηκε εικόνα' })
    const imagePath = `/uploads/${req.file.filename}`
    const resort = await prisma.resort.update({
      where: { id: req.user.id },
      data: { mapImage: imagePath }
    })
    res.json({ mapImage: resort.mapImage })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Upload φωτογραφιών στη gallery (πολλαπλό)
const uploadGallery = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Δεν επιλέχθηκαν εικόνες' })
    }
    const newPaths = req.files.map(f => `/uploads/${f.filename}`)
    const resort = await prisma.resort.findUnique({ where: { id: req.user.id } })
    const updated = await prisma.resort.update({
      where: { id: req.user.id },
      data: { gallery: [...resort.gallery, ...newPaths] }
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
    const resort = await prisma.resort.findUnique({ where: { id: req.user.id } })
    const updated = await prisma.resort.update({
      where: { id: req.user.id },
      data: { gallery: resort.gallery.filter(img => img !== imagePath) }
    })
    res.json({ gallery: updated.gallery })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ορισμός κύριας φωτογραφίας (banner)
const setMainImage = async (req, res) => {
  const { imagePath } = req.body
  try {
    const resort = await prisma.resort.update({
      where: { id: req.user.id },
      data: { image: imagePath }
    })
    res.json({ image: resort.image })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
module.exports = { createResort, getSchools, toggleSchool, deleteSchool, updateInfo, uploadMap, uploadGallery, deleteGalleryImage, setMainImage }