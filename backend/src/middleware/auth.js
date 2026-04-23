const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Δεν υπάρχει token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Δεν έχεις πρόσβαση' });
      }

      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Μη έγκυρο token' });
    }
  };
};

module.exports = auth;