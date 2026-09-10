const express = require('express');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const db = require('../db');
const { requireAuth, requireProjectMember } = require('../middleware/auth');
const { logActivity } = require('./projects');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const createSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required.').max(200),
  description: z.string().trim().max(4000).optional().default(''),
  status: z.enum(STATUSES).optional().default('todo'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

router.get('/:id/tasks', requireProjectMember('id'), (req, res) => {
  const tasks = db
    .prepare(
      `SELECT t.*, u.name as assignee_name, u.color as assignee_color
       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = ? ORDER BY t.position ASC, t.created_at ASC`
    )
    .all(req.params.id);
  res.json({ tasks });
});

router.post('/:id/tasks', requireProjectMember('id'), (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, description, status, priority, assigneeId, dueDate } = parsed.data;

  if (assigneeId) {
    const isMember = db
      .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(req.params.id, assigneeId);
    if (!isMember) {
      return res.status(400).json({ error: 'Assignee must be a member of this project.' });
    }
  }

  const maxPos = db
    .prepare('SELECT MAX(position) as maxPos FROM tasks WHERE project_id = ? AND status = ?')
    .get(req.params.id, status);

  const task = {
    id: uuid(),
    project_id: req.params.id,
    title,
    description,
    status,
    priority,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    created_by: req.user.id,
    position: (maxPos.maxPos ?? 0) + 1,
  };

  db.prepare(
    `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, due_date, created_by, position)
     VALUES (@id, @project_id, @title, @description, @status, @priority, @assignee_id, @due_date, @created_by, @position)`
  ).run(task);

  logActivity(req.params.id, req.user.id, `created task "${title}"`);

  const created = db
    .prepare(
      `SELECT t.*, u.name as assignee_name, u.color as assignee_color
       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?`
    )
    .get(task.id);
  res.status(201).json({ task: created });
});

module.exports = router;
