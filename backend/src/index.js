require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // ensures schema is created before routes load

const authRoutes = require('./routes/auth');
const { router: projectRoutes } = require('./routes/projects');
const projectTaskRoutes = require('./routes/projectTasks');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nova-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectTaskRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Central error handler — guarantees JSON errors instead of crashing/hanging
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  // express.json() throws a SyntaxError with status 400 for malformed request bodies
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`NOVA API listening on port ${PORT}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
