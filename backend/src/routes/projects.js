const express = require('express');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const db = require('../db');
const { requireAuth, requireProjectMember } = require('../middleware/auth');
const { pickAvatarColor } = require('../utils/auth');

const router = express.Router();
router.use(requireAuth);

const PROJECT_COLORS = ['#D9A234', '#1B7A6B', '#5B6EBF', '#B8492E', '#7A5BBF', '#3B8C5A'];

const createSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters.').max(120),
  description: z.string().trim().max(2000).optional().default(''),
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  archived: z.boolean().optional(),
});

const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(['admin', 'member']).optional().default('member'),
});

function slugKey(name) {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 4) || 'PROJ');
}

function logActivity(projectId, userId, action, detail = '') {
  db.prepare(
    'INSERT INTO activity (id, project_id, user_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(uuid(), projectId, userId, action, detail);
}

function projectStats(projectId) {
  const rows = db
    .prepare('SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status')
    .all(projectId);
  const stats = { todo: 0, in_progress: 0, in_review: 0, done: 0, total: 0 };
  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  stats.percentComplete = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  return stats;
}

// List all projects the current user belongs to
router.get('/', (req, res) => {
  const projects = db
    .prepare(
      `SELECT p.*, (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) as member_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(req.user.id);

  const memberPreviewStmt = db.prepare(
    `SELECT u.id, u.name, u.color FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ? ORDER BY pm.joined_at ASC LIMIT 4`
  );

  const withExtras = projects.map((p) => ({
    ...p,
    stats: projectStats(p.id),
    member_preview: memberPreviewStmt.all(p.id),
  }));
  res.json({ projects: withExtras });
});

// Create a project (creator becomes owner)
router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, description } = parsed.data;
  const id = uuid();

  const project = {
    id,
    name,
    key: slugKey(name),
    description,
    color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    owner_id: req.user.id,
  };

  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, key, description, color, owner_id) VALUES (@id, @name, @key, @description, @color, @owner_id)'
  );
  const insertMember = db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    insertProject.run(project);
    insertMember.run(id, req.user.id, 'owner');
    logActivity(id, req.user.id, 'created the project');
  });

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ project: { ...created, stats: projectStats(id) } });
});

// Get one project with members + stats
router.get('/:id', requireProjectMember('id'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.color, pm.role
       FROM project_members pm JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? ORDER BY pm.joined_at ASC`
    )
    .all(project.id);

  res.json({ project: { ...project, stats: projectStats(project.id), members } });
});

router.patch('/:id', requireProjectMember('id'), (req, res) => {
  if (!['owner', 'admin'].includes(req.membership.role)) {
    return res.status(403).json({ error: 'Only the owner or an admin can edit this project.' });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const next = { archived: parsed.data.archived !== undefined ? (parsed.data.archived ? 1 : 0) : project.archived };
  const name = parsed.data.name ?? project.name;
  const description = parsed.data.description ?? project.description;
  db.prepare('UPDATE projects SET name = @name, description = @description, archived = @archived WHERE id = @id').run({
    name,
    description,
    archived: next.archived,
    id: project.id,
  });
  logActivity(project.id, req.user.id, 'updated the project');

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  res.json({ project: { ...updated, stats: projectStats(project.id) } });
});

router.delete('/:id', requireProjectMember('id'), (req, res) => {
  if (req.membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can delete this project.' });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// Invite / add a member by email
router.post('/:id/members', requireProjectMember('id'), (req, res) => {
  if (!['owner', 'admin'].includes(req.membership.role)) {
    return res.status(403).json({ error: 'Only the owner or an admin can add members.' });
  }
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, role } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No NOVA account found with that email yet. They need to sign up first.' });
  }

  const already = db
    .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(req.params.id, user.id);
  if (already) {
    return res.status(409).json({ error: `${user.name} is already on this project.` });
  }

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(
    req.params.id,
    user.id,
    role
  );
  logActivity(req.params.id, req.user.id, `added ${user.name} to the project`);

  res.status(201).json({ member: { id: user.id, name: user.name, email: user.email, color: user.color, role } });
});

router.delete('/:id/members/:userId', requireProjectMember('id'), (req, res) => {
  const target = req.params.userId;
  const isSelf = target === req.user.id;
  if (!isSelf && !['owner', 'admin'].includes(req.membership.role)) {
    return res.status(403).json({ error: 'Only the owner or an admin can remove members.' });
  }
  const targetMembership = db
    .prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(req.params.id, target);
  if (targetMembership && targetMembership.role === 'owner') {
    return res.status(400).json({ error: 'The project owner cannot be removed.' });
  }
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, target);
  res.status(204).send();
});

router.get('/:id/activity', requireProjectMember('id'), (req, res) => {
  const items = db
    .prepare(
      `SELECT a.*, u.name as user_name, u.color as user_color
       FROM activity a JOIN users u ON u.id = a.user_id
       WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT 30`
    )
    .all(req.params.id);
  res.json({ activity: items });
});

module.exports = { router, projectStats, logActivity };
