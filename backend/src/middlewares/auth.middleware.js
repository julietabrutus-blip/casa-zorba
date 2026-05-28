const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError(401, 'Token no proporcionado.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    throw createError(401, 'Token inválido o expirado.');
  }
};

module.exports = { authenticate };
