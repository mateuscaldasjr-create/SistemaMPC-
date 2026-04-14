const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { start_date, end_date, technician_id, status } = req.query;
  let where = [];
  let params = [];

  if (start_date) { where.push('start_date >= ?'); params.push(start_date); }
  if (end_date) { where.push('start_date <= ?'); params.push(end_date); }
  if (technician_id) { where.push('s.technician_id = ?'); params.push(technician_id); }
  if (status) { where.push('s.status = ?'); params.push(status); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const schedules = db.prepare(`
    SELECT s.*, u.name as technician_name, c.name as client_name, t.ticket_number
    FROM schedules s
    LEFT JOIN users u ON s.technician_id = u.id
    LEFT JOIN clients c ON s.client_id = c.id
    LEFT JOIN tickets t ON s.ticket_id = t.id
    ${whereClause}
    ORDER BY s.start_date ASC
  `).all(...params);

  res.json(schedules);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, ticket_id, technician_id, client_id, start_date, end_date, recurrence } = req.body;
  if (!title || !start_date) return res.status(400).json({ error: 'Título e data são obrigatórios' });

  const result = db.prepare(`
    INSERT INTO schedules (title, description, ticket_id, technician_id, client_id, start_date, end_date, recurrence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, ticket_id || null, technician_id || null, client_id || null, start_date, end_date, recurrence || 'none');

  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(schedule);
});

router.put('/:id', authMiddleware, (req, res) => {
  const { title, description, technician_id, client_id, start_date, end_date, recurrence, status } = req.body;

  db.prepare(`
    UPDATE schedules SET title = ?, description = ?, technician_id = ?, client_id = ?,
    start_date = ?, end_date = ?, recurrence = ?, status = ?
    WHERE id = ?
  `).run(title, description, technician_id, client_id, start_date, end_date, recurrence, status, req.params.id);

  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  res.json(schedule);
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.json({ message: 'Agendamento excluído' });
});

module.exports = router;
