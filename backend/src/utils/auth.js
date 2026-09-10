const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

const AVATAR_COLORS = [
  '#D9A234', '#1B7A6B', '#B8492E', '#5B6EBF', '#7A5BBF', '#3B8C5A', '#C2703D', '#4A7A9E',
];

function pickAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken, pickAvatarColor, JWT_SECRET };
