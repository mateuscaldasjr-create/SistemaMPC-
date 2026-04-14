const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const { data } = await supabase.from('tickets').select('ticket_number').order('id', { ascending: false }).limit(1);
  let seq = 1;
  if (data && data.length > 0) {
    const parts = data[0].ticket_number.split('-');
    seq = parseInt(parts[2]) + 1;
  }
  return `CHM-${year}-${String(seq).padStart(4, '0')}`;
}

// List tickets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, priority, type, client_id, assigned_to, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('tickets').select(`
      *,
      clients!tickets_client_id_fkey(name, company),
      assigned:users!tickets_assigned_to_fkey(name),
      creator:users!tickets_created_by_fkey(name),
      equipment!tickets_equipment_id_fkey(name)
    `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (type) query = query.eq('type', type);
    if (client_id) query = query.eq('client_id', client_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,ticket_number.ilike.%${search}%`);

    if (req.user.role === 'tecnico') {
      query = query.eq('assigned_to', req.user.id);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    const tickets = (data || []).map(t => ({
      ...t,
      client_name: t.clients?.name,
      client_company: t.clients?.company,
      assigned_name: t.assigned?.name,
      creator_name: t.creator?.name,
      equipment_name: t.equipment?.name,
    }));

    res.json({ tickets, total: count || 0, page: parseInt(page), totalPages: Math.ceil((count || 0) / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { data: all } = await supabase.from('tickets').select('status, type, priority, created_at');
    const rows = all || [];

    const stats = {
      total: rows.length,
      abertos: rows.filter(r => r.status === 'aberto' || r.status === 'aprovado').length,
      em_andamento: rows.filter(r => r.status === 'em_andamento').length,
      aguardando: rows.filter(r => r.status === 'aguardando').length,
      concluidos: rows.filter(r => r.status === 'concluido').length,
      cancelados: rows.filter(r => r.status === 'cancelado').length,
      urgentes: rows.filter(r => r.priority === 'urgente' && !['concluido', 'cancelado'].includes(r.status)).length,
      by_type: Object.entries(rows.reduce((a, r) => { a[r.type] = (a[r.type] || 0) + 1; return a; }, {})).map(([type, count]) => ({ type, count })),
      by_priority: Object.entries(rows.filter(r => !['concluido', 'cancelado'].includes(r.status)).reduce((a, r) => { a[r.priority] = (a[r.priority] || 0) + 1; return a; }, {})).map(([priority, count]) => ({ priority, count })),
      by_status: Object.entries(rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {})).map(([status, count]) => ({ status, count })),
      monthly: Object.entries(rows.reduce((a, r) => { const m = r.created_at?.substring(0, 7); if (m) a[m] = (a[m] || 0) + 1; return a; }, {})).map(([month, count]) => ({ month, count })).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: ticket } = await supabase.from('tickets').select(`
      *,
      clients!tickets_client_id_fkey(name, company, phone, email),
      assigned:users!tickets_assigned_to_fkey(name, phone),
      creator:users!tickets_created_by_fkey(name),
      equipment!tickets_equipment_id_fkey(name, model, serial_number)
    `).eq('id', req.params.id).single();

    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const { data: comments } = await supabase.from('ticket_comments').select(`
      *, users!ticket_comments_user_id_fkey(name, role)
    `).eq('ticket_id', req.params.id).order('created_at', { ascending: false });

    const { data: history } = await supabase.from('ticket_history').select(`
      *, users!ticket_history_user_id_fkey(name)
    `).eq('ticket_id', req.params.id).order('created_at', { ascending: false });

    const { data: serviceOrders } = await supabase.from('service_orders').select(`
      *, users!service_orders_technician_id_fkey(name)
    `).eq('ticket_id', req.params.id).order('created_at', { ascending: false });

    res.json({
      ...ticket,
      client_name: ticket.clients?.name,
      client_company: ticket.clients?.company,
      client_phone: ticket.clients?.phone,
      client_email: ticket.clients?.email,
      assigned_name: ticket.assigned?.name,
      assigned_phone: ticket.assigned?.phone,
      creator_name: ticket.creator?.name,
      equipment_name: ticket.equipment?.name,
      equipment_model: ticket.equipment?.model,
      equipment_serial: ticket.equipment?.serial_number,
      comments: (comments || []).map(c => ({ ...c, user_name: c.users?.name, user_role: c.users?.role })),
      history: (history || []).map(h => ({ ...h, user_name: h.users?.name })),
      serviceOrders: (serviceOrders || []).map(so => ({ ...so, technician_name: so.users?.name })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create ticket
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, priority, client_id, equipment_id, assigned_to, scheduled_date, address, contact_name, contact_phone, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

    const ticket_number = await generateTicketNumber();

    const { data: ticket, error } = await supabase.from('tickets').insert({
      ticket_number, title, description, type: type || 'corretiva', priority: priority || 'media',
      client_id: client_id || null, equipment_id: equipment_id || null, assigned_to: assigned_to || null,
      created_by: req.user.id, scheduled_date: scheduled_date || null, address, contact_name, contact_phone, notes
    }).select().single();

    if (error) throw error;

    await supabase.from('ticket_history').insert({
      ticket_id: ticket.id, user_id: req.user.id, action: 'criado', new_value: 'Chamado criado'
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update ticket
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: ticket } = await supabase.from('tickets').select('*').eq('id', req.params.id).single();
    if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado' });

    const { title, description, type, priority, status, client_id, equipment_id, assigned_to, scheduled_date, address, contact_name, contact_phone, notes, estimated_hours, cost } = req.body;

    if (status && status !== ticket.status) {
      await supabase.from('ticket_history').insert({
        ticket_id: parseInt(req.params.id), user_id: req.user.id, action: 'status_alterado', old_value: ticket.status, new_value: status
      });
    }

    if (assigned_to && assigned_to !== ticket.assigned_to) {
      const { data: tech } = await supabase.from('users').select('name').eq('id', assigned_to).single();
      await supabase.from('ticket_history').insert({
        ticket_id: parseInt(req.params.id), user_id: req.user.id, action: 'atribuido', old_value: '', new_value: tech?.name || ''
      });
    }

    const completed_date = status === 'concluido' ? new Date().toISOString() : ticket.completed_date;

    const { data: updated, error } = await supabase.from('tickets').update({
      title: title || ticket.title, description: description ?? ticket.description, type: type || ticket.type,
      priority: priority || ticket.priority, status: status || ticket.status,
      client_id: client_id ?? ticket.client_id, equipment_id: equipment_id ?? ticket.equipment_id,
      assigned_to: assigned_to ?? ticket.assigned_to, scheduled_date: scheduled_date ?? ticket.scheduled_date,
      address: address ?? ticket.address, contact_name: contact_name ?? ticket.contact_name,
      contact_phone: contact_phone ?? ticket.contact_phone, notes: notes ?? ticket.notes,
      estimated_hours: estimated_hours ?? ticket.estimated_hours, cost: cost ?? ticket.cost,
      completed_date, updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { comment, is_internal } = req.body;
    if (!comment) return res.status(400).json({ error: 'Comentário é obrigatório' });

    await supabase.from('ticket_comments').insert({
      ticket_id: parseInt(req.params.id), user_id: req.user.id, comment, is_internal: !!is_internal
    });

    await supabase.from('ticket_history').insert({
      ticket_id: parseInt(req.params.id), user_id: req.user.id, action: 'comentario', new_value: 'Novo comentário adicionado'
    });

    res.status(201).json({ message: 'Comentário adicionado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ticket
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await supabase.from('ticket_comments').delete().eq('ticket_id', req.params.id);
  await supabase.from('ticket_history').delete().eq('ticket_id', req.params.id);
  await supabase.from('tickets').delete().eq('id', req.params.id);
  res.json({ message: 'Chamado excluído' });
});

// Public ticket creation
router.post('/public', async (req, res) => {
  try {
    const { title, description, type, priority, contact_name, contact_phone, client_id, address } = req.body;
    if (!title || !contact_name) return res.status(400).json({ error: 'Título e nome de contato são obrigatórios' });

    const ticket_number = await generateTicketNumber();

    const { data: ticket } = await supabase.from('tickets').insert({
      ticket_number, title, description, type: type || 'corretiva', priority: priority || 'media',
      client_id: client_id || null, contact_name, contact_phone, address
    }).select().single();

    await supabase.from('ticket_history').insert({
      ticket_id: ticket.id, action: 'criado', new_value: 'Chamado aberto pelo cliente'
    });

    res.status(201).json({ ticket_number, message: 'Chamado aberto com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
