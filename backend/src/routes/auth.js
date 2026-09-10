const express = require('express');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const db = require('../db');
const { hashPassword, comparePassword, signToken, pickAvatarColor } = require('../utils/auth');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, color: user.color };
}

router.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const user = {
    id: uuid(),
    name,
    email: normalizedEmail,
    password_hash: hashPassword(password),
    color: pickAvatarColor(),
  };

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, color) VALUES (@id, @name, @email, @password_hash, @color)'
  ).run(user);

  const token = signToken({ sub: user.id });
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = signToken({ sub: user.id });
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
