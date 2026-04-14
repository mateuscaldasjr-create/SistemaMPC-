const express = require('express');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const dashboard = {
    tickets: {
      total: db.prepare('SELECT COUNT(*) as count FROM tickets').get().count,
      abertos: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status IN ('aberto', 'aprovado')").get().count,
      em_andamento: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'em_andamento'").get().count,
      aguardando: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'aguardando'").get().count,
      concluidos: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'concluido'").get().count,
      cancelados: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'cancelado'").get().count,
      urgentes: db.prepare("SELECT COUNT(*) as count FROM tickets WHERE priority = 'urgente' AND status NOT IN ('concluido', 'cancelado')").get().count
    },
    serviceOrders: {
      total: db.prepare('SELECT COUNT(*) as count FROM service_orders').get().count,
      em_execucao: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'em_execucao'").get().count,
      finalizadas: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'finalizada'").get().count,
      pendentes: db.prepare("SELECT COUNT(*) as count FROM service_orders WHERE status = 'pendente'").get().count,
      revenue: db.prepare("SELECT COALESCE(SUM(cost_total), 0) as total FROM service_orders WHERE status = 'finalizada'").get().total
    },
    clients: {
      total: db.prepare('SELECT COUNT(*) as count FROM clients WHERE active = 1').get().count
    },
    equipment: {
      total: db.prepare('SELECT COUNT(*) as count FROM equipment').get().count,
      em_manutencao: db.prepare("SELECT COUNT(*) as count FROM equipment WHERE status = 'manutencao'").get().count
    },
    technicians: {
      total: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'tecnico' AND active = 1").get().count,
      with_tickets: db.prepare(`
        SELECT COUNT(DISTINCT assigned_to) as count FROM tickets
        WHERE status IN ('em_andamento', 'aberto', 'aprovado') AND assigned_to IS NOT NULL
      `).get().count
    },
    charts: {
      ticketsByStatus: db.prepare("SELECT status, COUNT(*) as count FROM tickets GROUP BY status").all(),
      ticketsByType: db.prepare("SELECT type, COUNT(*) as count FROM tickets GROUP BY type").all(),
      ticketsByPriority: db.prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE status NOT IN ('concluido', 'cancelado') GROUP BY priority").all(),
      ticketsMonthly: db.prepare(`
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as total,
          SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos
        FROM tickets GROUP BY strftime('%Y-%m', created_at) ORDER BY month DESC LIMIT 6
      `).all().reverse(),
      topClients: db.prepare(`
        SELECT c.name, c.company, COUNT(t.id) as ticket_count
        FROM clients c LEFT JOIN tickets t ON t.client_id = c.id
        GROUP BY c.id ORDER BY ticket_count DESC LIMIT 5
      `).all(),
      technicianPerformance: db.prepare(`
        SELECT u.name,
          COUNT(t.id) as total,
          SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
          SUM(CASE WHEN t.status IN ('em_andamento', 'aberto') THEN 1 ELSE 0 END) as pendentes
        FROM users u LEFT JOIN tickets t ON t.assigned_to = u.id
        WHERE u.role = 'tecnico' AND u.active = 1
        GROUP BY u.id ORDER BY total DESC
      `).all()
    },
    recentTickets: db.prepare(`
      SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.created_at,
        c.name as client_name, u.name as assigned_name
      FROM tickets t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC LIMIT 10
    `).all(),
    recentOrders: db.prepare(`
      SELECT so.id, so.order_number, so.status, so.cost_total, so.created_at,
        u.name as technician_name, c.name as client_name
      FROM service_orders so
      LEFT JOIN users u ON so.technician_id = u.id
      LEFT JOIN clients c ON so.client_id = c.id
      ORDER BY so.created_at DESC LIMIT 5
    `).all()
  };

  res.json(dashboard);
});

module.exports = router;
