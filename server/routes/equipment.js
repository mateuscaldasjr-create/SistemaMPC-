const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { search, client_id, status, category, page = 1, limit = 50 } = req.query;
  let where = [];
  let params = [];

  if (search) {
    where.push('(e.name LIKE ? OR e.model LIKE ? OR e.serial_number LIKE ? OR e.brand LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (client_id) { where.push('e.client_id = ?'); params.push(client_id); }
  if (status) { where.push('e.status = ?'); params.push(status); }
  if (category) { where.push('e.category = ?'); params.push(category); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM equipment e ${whereClause}`).get(...params).count;
  const equipments = db.prepare(`
    SELECT e.*, c.name as client_name, c.company as client_company
    FROM equipment e
    LEFT JOIN clients c ON e.client_id = c.id
    ${whereClause}
    ORDER BY e.name ASC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ equipments, total });
});

router.get('/categories', authMiddleware, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM equipment WHERE category IS NOT NULL ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

router.get('/:id', authMiddleware, (req, res) => {
  const equipment = db.prepare(`
    SELECT e.*, c.name as client_name, c.company as client_company
    FROM equipment e
    LEFT JOIN clients c ON e.client_id = c.id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });

  const tickets = db.prepare(`
    SELECT t.*, u.name as assigned_name
    FROM tickets t LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.equipment_id = ? ORDER BY t.created_at DESC
  `).all(req.params.id);

  res.json({ ...equipment, tickets });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, model, serial_number, brand, category, client_id, location, status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

  const result = db.prepare(`
    INSERT INTO equipment (name, model, serial_number, brand, category, client_id, location, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, model, serial_number, brand, category, client_id || null, location, status || 'ativo', notes);

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(equipment);
});

router.put('/:id', authMiddleware, (req, res) => {
  const { name, model, serial_number, brand, category, client_id, location, status, notes } = req.body;

  db.prepare(`
    UPDATE equipment SET name = ?, model = ?, serial_number = ?, brand = ?, category = ?,
    client_id = ?, location = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, model, serial_number, brand, category, client_id || null, location, status, notes, req.params.id);

  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
  res.json(equipment);
});

router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
  res.json({ message: 'Equipamento excluído' });
});

module.exports = router;
