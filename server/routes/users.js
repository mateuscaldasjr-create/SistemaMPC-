const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { role, search, active } = req.query;
  let where = [];
  let params = [];

  if (role) { where.push('role = ?'); params.push(role); }
  if (active !== undefined) { where.push('active = ?'); params.push(active); }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const users = db.prepare(`
    SELECT id, name, email, role, phone, active, created_at,
      (SELECT COUNT(*) FROM tickets WHERE assigned_to = users.id) as ticket_count,
      (SELECT COUNT(*) FROM tickets WHERE assigned_to = users.id AND status = 'concluido') as completed_count
    FROM users ${whereClause} ORDER BY name ASC
  `).all(...params);

  res.json(users);
});

router.get('/technicians', authMiddleware, (req, res) => {
  const technicians = db.prepare(`
    SELECT id, name, email, phone, role,
      (SELECT COUNT(*) FROM tickets WHERE assigned_to = users.id AND status NOT IN ('concluido', 'cancelado')) as active_tickets
    FROM users WHERE role IN ('tecnico', 'gestor', 'admin') AND active = 1 ORDER BY name
  `).all();
  res.json(technicians);
});

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, active, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, hashedPassword, role || 'tecnico', phone);

  const user = db.prepare('SELECT id, name, email, role, phone, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { name, email, role, phone, active, password } = req.body;

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, phone = ?, active = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, email, role, phone, active ?? 1, hashedPassword, req.params.id);
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, phone = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, email, role, phone, active ?? 1, req.params.id);
  }

  const user = db.prepare('SELECT id, name, email, role, phone, active, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('UPDATE users SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  res.json({ message: 'Usuário desativado' });
});

module.exports = router;
