const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { createError } = require('../middlewares/errorHandler');

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError(400, 'Email y password requeridos.');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) throw createError(401, 'Credenciales inválidas.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError(401, 'Credenciales inválidas.');

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
  });
};

const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, nombre: true, rol: true },
  });
  res.json(user);
};

module.exports = { login, me };
