const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const last = db.prepare("SELECT order_number FROM service_orders ORDER BY id DESC LIMIT 1").get();
  let seq = 1;
  if (last) {
    const parts = last.order_number.split('-');
    seq = parseInt(parts[2]) + 1;
  }
  return `OS-${year}-${String(seq).padStart(4, '0')}`;
}

// List service orders
router.get('/', authMiddleware, (req, res) => {
  const { status, technician_id, client_id, search, page = 1, limit = 20 } = req.query;
  let where = [];
  let params = [];

  if (status) { where.push('so.status = ?'); params.push(status); }
  if (technician_id) { where.push('so.technician_id = ?'); params.push(technician_id); }
  if (client_id) { where.push('so.client_id = ?'); params.push(client_id); }
  if (search) {
    where.push('(so.order_number LIKE ? OR so.diagnosis LIKE ? OR so.service_performed LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (req.user.role === 'tecnico') {
    where.push('so.technician_id = ?');
    params.push(req.user.id);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as count FROM service_orders so ${whereClause}`).get(...params).count;

  const orders = db.prepare(`
    SELECT so.*,
      t.ticket_number, t.title as ticket_title,
      u.name as technician_name,
      c.name as client_name, c.company as client_company,
      e.name as equipment_name
    FROM service_orders so
    LEFT JOIN tickets t ON so.ticket_id = t.id
    LEFT JOIN users u ON so.technician_id = u.id
    LEFT JOIN clients c ON so.client_id = c.id
    LEFT JOIN equipment e ON so.equipment_id = e.id
    ${whereClause}
    ORDER BY so.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// Get stats
router.get('/stats', authMiddleware, (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM service_orders').get().count,
    pendentes: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'pendente'").get().count,
    em_execucao: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'em_execucao'").get().count,
    finalizadas: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'finalizada'").get().count,
    revenue: db.prepare("SELECT COALESCE(SUM(cost_total), 0) as total FROM service_orders WHERE status = 'finalizada'").get().total,
    avg_time: db.prepare(`
      SELECT AVG((julianday(end_time) - julianday(start_time)) * 24) as hours
      FROM service_orders WHERE status = 'finalizada' AND start_time IS NOT NULL AND end_time IS NOT NULL
    `).get().hours
  };
  res.json(stats);
});

// Get single service order
router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT so.*,
      t.ticket_number, t.title as ticket_title, t.description as ticket_description,
      u.name as technician_name, u.phone as technician_phone,
      c.name as client_name, c.company as client_company, c.phone as client_phone, c.email as client_email, c.address as client_address,
      e.name as equipment_name, e.model as equipment_model, e.serial_number as equipment_serial
    FROM service_orders so
    LEFT JOIN tickets t ON so.ticket_id = t.id
    LEFT JOIN users u ON so.technician_id = u.id
    LEFT JOIN clients c ON so.client_id = c.id
    LEFT JOIN equipment e ON so.equipment_id = e.id
    WHERE so.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  res.json(order);
});

// Create service order
router.post('/', authMiddleware, (req, res) => {
  const { ticket_id, technician_id, client_id, equipment_id, diagnosis, service_performed, materials_used, observations, cost_labor, cost_materials } = req.body;

  const order_number = generateOrderNumber();
  const cost_total = (parseFloat(cost_labor) || 0) + (parseFloat(cost_materials) || 0);

  const result = db.prepare(`
    INSERT INTO service_orders (order_number, ticket_id, technician_id, client_id, equipment_id, diagnosis, service_performed, materials_used, observations, cost_labor, cost_materials, cost_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order_number, ticket_id || null, technician_id || req.user.id, client_id || null, equipment_id || null, diagnosis, service_performed, materials_used, observations, cost_labor || 0, cost_materials || 0, cost_total);

  // Update ticket status if linked
  if (ticket_id) {
    db.prepare("UPDATE tickets SET status = 'em_andamento', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ticket_id);
  }

  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

// Update service order
router.put('/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
  }

  const { status, start_time, end_time, diagnosis, service_performed, materials_used, observations, client_signature, technician_signature, cost_labor, cost_materials, latitude, longitude } = req.body;

  const cost_total = (parseFloat(cost_labor ?? order.cost_labor) || 0) + (parseFloat(cost_materials ?? order.cost_materials) || 0);

  db.prepare(`
    UPDATE service_orders SET
      status = ?, start_time = ?, end_time = ?, diagnosis = ?,
      service_performed = ?, materials_used = ?, observations = ?,
      client_signature = ?, technician_signature = ?,
      cost_labor = ?, cost_materials = ?, cost_total = ?,
      latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status || order.status, start_time ?? order.start_time, end_time ?? order.end_time,
    diagnosis ?? order.diagnosis, service_performed ?? order.service_performed,
    materials_used ?? order.materials_used, observations ?? order.observations,
    client_signature ?? order.client_signature, technician_signature ?? order.technician_signature,
    cost_labor ?? order.cost_labor, cost_materials ?? order.cost_materials, cost_total,
    latitude ?? order.latitude, longitude ?? order.longitude, req.params.id
  );

  // Update ticket status when service order is completed
  if (status === 'finalizada' && order.ticket_id) {
    db.prepare("UPDATE tickets SET status = 'concluido', completed_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.ticket_id);
  }

  const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete service order
router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM service_orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Ordem de serviço excluída' });
});

module.exports = router;
