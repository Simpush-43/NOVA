const express = require('express');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { logActivity } = require('./projects');

const router = express.Router();
router.use(requireAuth);

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
});

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty.').max(2000),
});

function loadTaskWithMembership(req, res, next) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const membership = db
    .prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(task.project_id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'You are not a member of this project.' });

  req.task = task;
  next();
}

router.patch('/:taskId', loadTaskWithMembership, (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const updates = parsed.data;

  if (updates.assigneeId) {
    const isMember = db
      .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(req.task.project_id, updates.assigneeId);
    if (!isMember) {
      return res.status(400).json({ error: 'Assignee must be a member of this project.' });
    }
  }

  const next = {
    title: updates.title ?? req.task.title,
    description: updates.description ?? req.task.description,
    status: updates.status ?? req.task.status,
    priority: updates.priority ?? req.task.priority,
    assignee_id: updates.assigneeId !== undefined ? updates.assigneeId : req.task.assignee_id,
    due_date: updates.dueDate !== undefined ? updates.dueDate : req.task.due_date,
    position: updates.position ?? req.task.position,
    updated_at: new Date().toISOString(),
    id: req.task.id,
  };

  db.prepare(
    `UPDATE tasks SET title=@title, description=@description, status=@status, priority=@priority,
     assignee_id=@assignee_id, due_date=@due_date, position=@position, updated_at=@updated_at WHERE id=@id`
  ).run(next);

  if (updates.status && updates.status !== req.task.status) {
    logActivity(req.task.project_id, req.user.id, `moved "${req.task.title}" to ${updates.status.replace('_', ' ')}`);
  }

  const updated = db
    .prepare(
      `SELECT t.*, u.name as assignee_name, u.color as assignee_color
       FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?`
    )
    .get(req.task.id);
  res.json({ task: updated });
});

router.delete('/:taskId', loadTaskWithMembership, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.task.id);
  logActivity(req.task.project_id, req.user.id, `deleted task "${req.task.title}"`);
  res.status(204).send();
});

router.get('/:taskId/comments', loadTaskWithMembership, (req, res) => {
  const comments = db
    .prepare(
      `SELECT c.*, u.name as user_name, u.color as user_color
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ? ORDER BY c.created_at ASC`
    )
    .all(req.task.id);
  res.json({ comments });
});

router.post('/:taskId/comments', loadTaskWithMembership, (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const comment = { id: uuid(), task_id: req.task.id, user_id: req.user.id, body: parsed.data.body };
  db.prepare('INSERT INTO comments (id, task_id, user_id, body) VALUES (@id, @task_id, @user_id, @body)').run(comment);

  const created = db
    .prepare(
      `SELECT c.*, u.name as user_name, u.color as user_color
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(comment.id);
  res.status(201).json({ comment: created });
});

module.exports = router;
