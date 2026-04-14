const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  let where = ['active = 1'];
  let params = [];

  if (search) {
    where.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR document LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = 'WHERE ' + where.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM clients ${whereClause}`).get(...params).count;
  const clients = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM tickets WHERE client_id = c.id) as ticket_count,
      (SELECT COUNT(*) FROM equipment WHERE client_id = c.id) as equipment_count
    FROM clients c ${whereClause} ORDER BY c.name ASC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ clients, total });
});

router.get('/:id', authMiddleware, (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  const tickets = db.prepare(`
    SELECT t.*, u.name as assigned_name FROM tickets t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.client_id = ? ORDER BY t.created_at DESC
  `).all(req.params.id);

  const equipments = db.prepare('SELECT * FROM equipment WHERE client_id = ?').all(req.params.id);

  res.json({ ...client, tickets, equipments });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, email, phone, document, company, address, city, state, zip_code, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const result = db.prepare(`
    INSERT INTO clients (name, email, phone, document, company, address, city, state, zip_code, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, email, phone, document, company, address, city, state, zip_code, notes);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.put('/:id', authMiddleware, (req, res) => {
  const { name, email, phone, document, company, address, city, state, zip_code, notes } = req.body;

  db.prepare(`
    UPDATE clients SET name = ?, email = ?, phone = ?, document = ?, company = ?,
    address = ?, city = ?, state = ?, zip_code = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, email, phone, document, company, address, city, state, zip_code, notes, req.params.id);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(client);
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('UPDATE clients SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Cliente desativado' });
});

module.exports = router;
