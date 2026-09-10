const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const like = `%${q}%`;
  const users = db
    .prepare('SELECT id, name, email, color FROM users WHERE (name LIKE ? OR email LIKE ?) AND id != ? LIMIT 8')
    .all(like, like, req.user.id);
  res.json({ users });
});

module.exports = router;
