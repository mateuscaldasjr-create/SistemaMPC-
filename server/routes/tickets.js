const express = require('express');
const { db } = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

function generateTicketNumber() {
  const year = new Date().getFullYear();
  const last = db.prepare("SELECT ticket_number FROM tickets ORDER BY id DESC LIMIT 1").get();
  let seq = 1;
  if (last) {
    const parts = last.ticket_number.split('-');
    seq = parseInt(parts[2]) + 1;
  }
  return `CHM-${year}-${String(seq).padStart(4, '0')}`;
}

// List all tickets with filters
router.get('/', authMiddleware, (req, res) => {
  const { status, priority, type, client_id, assigned_to, search, page = 1, limit = 20 } = req.query;
  let where = [];
  let params = [];

  if (status) { where.push('t.status = ?'); params.push(status); }
  if (priority) { where.push('t.priority = ?'); params.push(priority); }
  if (type) { where.push('t.type = ?'); params.push(type); }
  if (client_id) { where.push('t.client_id = ?'); params.push(client_id); }
  if (assigned_to) { where.push('t.assigned_to = ?'); params.push(assigned_to); }
  if (search) {
    where.push('(t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // If technician, only show assigned tickets
  if (req.user.role === 'tecnico') {
    where.push('t.assigned_to = ?');
    params.push(req.user.id);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM tickets t ${whereClause}`).get(...params).count;

  const tickets = db.prepare(`
    SELECT t.*,
      c.name as client_name, c.company as client_company,
      u.name as assigned_name,
      cr.name as creator_name,
      e.name as equipment_name
    FROM tickets t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users cr ON t.created_by = cr.id
    LEFT JOIN equipment e ON t.equipment_id = e.id
    ${whereClause}
    ORDER BY
      CASE t.priority WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 WHEN 'baixa' THEN 4 END,
      t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ tickets, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Get ticket stats
router.get('/stats', authMiddleware, (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
    abertos: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('aberto', 'aprovado')").get().count,
    em_andamento: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'em_andamento'").get().count,
    aguardando: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'aguardando'").get().count,
    concluidos: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'concluido'").get().count,
    cancelados: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'cancelado'").get().count,
    urgentes: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'urgente' AND status NOT IN ('concluido', 'cancelado')").get().count,
    by_type: db.prepare("SELECT type, COUNT(*) as count FROM tickets GROUP BY type").all(),
    by_priority: db.prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE status NOT IN ('concluido', 'cancelado') GROUP BY priority").all(),
    by_status: db.prepare("SELECT status, COUNT(*) as count FROM tickets GROUP BY status").all(),
    recent: db.prepare(`
      SELECT t.*, c.name as client_name, u.name as assigned_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC LIMIT 5
    `).all(),
    monthly: db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM tickets
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC LIMIT 12
    `).all()
  };
  res.json(stats);
});

// Get single ticket
router.get('/:id', authMiddleware, (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*,
      c.name as client_name, c.company as client_company, c.phone as client_phone, c.email as client_email,
      u.name as assigned_name, u.phone as assigned_phone,
      cr.name as creator_name,
      e.name as equipment_name, e.model as equipment_model, e.serial_number as equipment_serial
    FROM tickets t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users cr ON t.created_by = cr.id
    LEFT JOIN equipment e ON t.equipment_id = e.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: 'Chamado não encontrado' });
  }

  const comments = db.prepare(`
    SELECT tc.*, u.name as user_name, u.role as user_role
    FROM ticket_comments tc
    LEFT JOIN users u ON tc.user_id = u.id
    WHERE tc.ticket_id = ?
    ORDER BY tc.created_at DESC
  `).all(req.params.id);

  const history = db.prepare(`
    SELECT th.*, u.name as user_name
    FROM ticket_history th
    LEFT JOIN users u ON th.user_id = u.id
    WHERE th.ticket_id = ?
    ORDER BY th.created_at DESC
  `).all(req.params.id);

  const serviceOrders = db.prepare(`
    SELECT so.*, u.name as technician_name
    FROM service_orders so
    LEFT JOIN users u ON so.technician_id = u.id
    WHERE so.ticket_id = ?
    ORDER BY so.created_at DESC
  `).all(req.params.id);

  res.json({ ...ticket, comments, history, serviceOrders });
});

// Create ticket
router.post('/', authMiddleware, (req, res) => {
  const { title, description, type, priority, client_id, equipment_id, assigned_to, scheduled_date, address, contact_name, contact_phone, notes } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  const ticket_number = generateTicketNumber();

  const result = db.prepare(`
    INSERT INTO tickets (ticket_number, title, description, type, priority, client_id, equipment_id, assigned_to, created_by, scheduled_date, address, contact_name, contact_phone, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticket_number, title, description, type || 'corretiva', priority || 'media', client_id || null, equipment_id || null, assigned_to || null, req.user.id, scheduled_date || null, address, contact_name, contact_phone, notes);

  db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)')
    .run(result.lastInsertRowid, req.user.id, 'criado', 'Chamado criado');

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(ticket);
});

// Update ticket
router.put('/:id', authMiddleware, (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Chamado não encontrado' });
  }

  const { title, description, type, priority, status, client_id, equipment_id, assigned_to, scheduled_date, address, contact_name, contact_phone, notes, estimated_hours, cost } = req.body;

  // Track status change
  if (status && status !== ticket.status) {
    db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.user.id, 'status_alterado', ticket.status, status);
  }

  if (assigned_to && assigned_to !== ticket.assigned_to) {
    const tech = db.prepare('SELECT name FROM users WHERE id = ?').get(assigned_to);
    db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.user.id, 'atribuido', '', tech ? tech.name : '');
  }

  const completed_date = status === 'concluido' ? new Date().toISOString() : ticket.completed_date;

  db.prepare(`
    UPDATE tickets SET
      title = ?, description = ?, type = ?, priority = ?, status = ?,
      client_id = ?, equipment_id = ?, assigned_to = ?, scheduled_date = ?,
      address = ?, contact_name = ?, contact_phone = ?, notes = ?,
      estimated_hours = ?, cost = ?, completed_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || ticket.title, description ?? ticket.description, type || ticket.type,
    priority || ticket.priority, status || ticket.status,
    client_id ?? ticket.client_id, equipment_id ?? ticket.equipment_id,
    assigned_to ?? ticket.assigned_to, scheduled_date ?? ticket.scheduled_date,
    address ?? ticket.address, contact_name ?? ticket.contact_name,
    contact_phone ?? ticket.contact_phone, notes ?? ticket.notes,
    estimated_hours ?? ticket.estimated_hours, cost ?? ticket.cost,
    completed_date, req.params.id
  );

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Add comment
router.post('/:id/comments', authMiddleware, (req, res) => {
  const { comment, is_internal } = req.body;

  if (!comment) {
    return res.status(400).json({ error: 'Comentário é obrigatório' });
  }

  db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, comment, is_internal ? 1 : 0);

  db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, 'comentario', 'Novo comentário adicionado');

  res.status(201).json({ message: 'Comentário adicionado' });
});

// Delete ticket
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  db.prepare('DELETE FROM ticket_comments WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM ticket_history WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Chamado excluído' });
});

// Public ticket creation (no auth required)
router.post('/public', (req, res) => {
  const { title, description, type, priority, contact_name, contact_phone, client_id, address } = req.body;

  if (!title || !contact_name) {
    return res.status(400).json({ error: 'Título e nome de contato são obrigatórios' });
  }

  const ticket_number = generateTicketNumber();

  const result = db.prepare(`
    INSERT INTO tickets (ticket_number, title, description, type, priority, client_id, contact_name, contact_phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticket_number, title, description, type || 'corretiva', priority || 'media', client_id || null, contact_name, contact_phone, address);

  db.prepare('INSERT INTO ticket_history (ticket_id, action, new_value) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, 'criado', 'Chamado aberto pelo cliente');

  res.status(201).json({ ticket_number, message: 'Chamado aberto com sucesso!' });
});

module.exports = router;
