const { verifyToken } = require('../utils/auth');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, name, email, color FROM users WHERE id = ?').get(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Session no longer valid. Sign in again.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
}

// Confirms req.user is a member of the project in req.params.id / req.params.projectId
function requireProjectMember(paramName = 'id') {
  return (req, res, next) => {
    const projectId = req.params[paramName];
    const membership = db
      .prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, req.user.id);

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this project.' });
    }
    req.membership = membership;
    next();
  };
}

module.exports = { requireAuth, requireProjectMember };
