const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetch all data in parallel
    const [
      { data: allTickets },
      { data: allOrders },
      { count: clientCount },
      { data: allEquipment },
      { data: allTechnicians },
    ] = await Promise.all([
      supabase.from('tickets').select('id, status, type, priority, created_at, assigned_to, client_id'),
      supabase.from('service_orders').select('id, status, cost_total, created_at, technician_id, client_id'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('equipment').select('id, status'),
      supabase.from('users').select('id, name, role, active').eq('role', 'tecnico').eq('active', true),
    ]);

    const tickets = allTickets || [];
    const orders = allOrders || [];
    const equipment = allEquipment || [];
    const technicians = allTechnicians || [];

    // Ticket stats
    const ticketStats = {
      total: tickets.length,
      abertos: tickets.filter(t => t.status === 'aberto' || t.status === 'aprovado').length,
      em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
      aguardando: tickets.filter(t => t.status === 'aguardando').length,
      concluidos: tickets.filter(t => t.status === 'concluido').length,
      cancelados: tickets.filter(t => t.status === 'cancelado').length,
      urgentes: tickets.filter(t => t.priority === 'urgente' && !['concluido', 'cancelado'].includes(t.status)).length,
    };

    // Service order stats
    const finalizadas = orders.filter(o => o.status === 'finalizada');
    const orderStats = {
      total: orders.length,
      em_execucao: orders.filter(o => o.status === 'em_execucao').length,
      finalizadas: finalizadas.length,
      pendentes: orders.filter(o => o.status === 'pendente').length,
      revenue: finalizadas.reduce((sum, o) => sum + (o.cost_total || 0), 0),
    };

    // Charts data
    const byStatus = Object.entries(tickets.reduce((a, t) => { a[t.status] = (a[t.status] || 0) + 1; return a; }, {})).map(([status, count]) => ({ status, count }));
    const byType = Object.entries(tickets.reduce((a, t) => { a[t.type] = (a[t.type] || 0) + 1; return a; }, {})).map(([type, count]) => ({ type, count }));
    const byPriority = Object.entries(tickets.filter(t => !['concluido', 'cancelado'].includes(t.status)).reduce((a, t) => { a[t.priority] = (a[t.priority] || 0) + 1; return a; }, {})).map(([priority, count]) => ({ priority, count }));

    const monthlyMap = tickets.reduce((a, t) => {
      const m = t.created_at?.substring(0, 7);
      if (m) {
        if (!a[m]) a[m] = { total: 0, concluidos: 0 };
        a[m].total++;
        if (t.status === 'concluido') a[m].concluidos++;
      }
      return a;
    }, {});
    const ticketsMonthly = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v })).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6).reverse();

    // Top clients
    const clientTicketMap = tickets.reduce((a, t) => { if (t.client_id) a[t.client_id] = (a[t.client_id] || 0) + 1; return a; }, {});
    const topClientIds = Object.entries(clientTicketMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => parseInt(e[0]));
    let topClients = [];
    if (topClientIds.length > 0) {
      const { data: clientData } = await supabase.from('clients').select('id, name, company').in('id', topClientIds);
      topClients = (clientData || []).map(c => ({
        name: c.name, company: c.company, ticket_count: clientTicketMap[c.id] || 0,
      })).sort((a, b) => b.ticket_count - a.ticket_count);
    }

    // Technician performance
    const techPerformance = technicians.map(tech => {
      const techTickets = tickets.filter(t => t.assigned_to === tech.id);
      return {
        name: tech.name,
        total: techTickets.length,
        concluidos: techTickets.filter(t => t.status === 'concluido').length,
        pendentes: techTickets.filter(t => ['em_andamento', 'aberto'].includes(t.status)).length,
      };
    }).sort((a, b) => b.total - a.total);

    // Recent tickets with joins
    const { data: recentTickets } = await supabase.from('tickets').select(`
      id, ticket_number, title, status, priority, created_at,
      clients!tickets_client_id_fkey(name),
      assigned:users!tickets_assigned_to_fkey(name)
    `).order('created_at', { ascending: false }).limit(10);

    const { data: recentOrders } = await supabase.from('service_orders').select(`
      id, order_number, status, cost_total, created_at,
      technician:users!service_orders_technician_id_fkey(name),
      clients!service_orders_client_id_fkey(name)
    `).order('created_at', { ascending: false }).limit(5);

    const dashboard = {
      tickets: ticketStats,
      serviceOrders: orderStats,
      clients: { total: clientCount || 0 },
      equipment: {
        total: equipment.length,
        em_manutencao: equipment.filter(e => e.status === 'manutencao').length,
      },
      technicians: {
        total: technicians.length,
        with_tickets: new Set(tickets.filter(t => ['em_andamento', 'aberto', 'aprovado'].includes(t.status) && t.assigned_to).map(t => t.assigned_to)).size,
      },
      charts: {
        ticketsByStatus: byStatus,
        ticketsByType: byType,
        ticketsByPriority: byPriority,
        ticketsMonthly,
        topClients,
        technicianPerformance: techPerformance,
      },
      recentTickets: (recentTickets || []).map(t => ({
        ...t, client_name: t.clients?.name, assigned_name: t.assigned?.name,
      })),
      recentOrders: (recentOrders || []).map(o => ({
        ...o, technician_name: o.technician?.name, client_name: o.clients?.name,
      })),
    };

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
