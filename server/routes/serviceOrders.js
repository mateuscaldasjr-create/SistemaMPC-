const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const { data } = await supabase.from('service_orders').select('order_number').order('id', { ascending: false }).limit(1);
  let seq = 1;
  if (data && data.length > 0) {
    const parts = data[0].order_number.split('-');
    seq = parseInt(parts[2]) + 1;
  }
  return `OS-${year}-${String(seq).padStart(4, '0')}`;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, technician_id, client_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('service_orders').select(`
      *,
      tickets!service_orders_ticket_id_fkey(ticket_number, title),
      technician:users!service_orders_technician_id_fkey(name),
      clients!service_orders_client_id_fkey(name, company),
      equipment!service_orders_equipment_id_fkey(name)
    `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (technician_id) query = query.eq('technician_id', technician_id);
    if (client_id) query = query.eq('client_id', client_id);
    if (search) query = query.or(`order_number.ilike.%${search}%,diagnosis.ilike.%${search}%,service_performed.ilike.%${search}%`);
    if (req.user.role === 'tecnico') query = query.eq('technician_id', req.user.id);

    const { data, count } = await query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    const orders = (data || []).map(o => ({
      ...o,
      ticket_number: o.tickets?.ticket_number,
      ticket_title: o.tickets?.title,
      technician_name: o.technician?.name,
      client_name: o.clients?.name,
      client_company: o.clients?.company,
      equipment_name: o.equipment?.name,
    }));

    res.json({ orders, total: count || 0, page: parseInt(page), totalPages: Math.ceil((count || 0) / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { data: all } = await supabase.from('service_orders').select('status, cost_total, start_time, end_time');
    const rows = all || [];
    const finalizadas = rows.filter(r => r.status === 'finalizada');

    let totalHours = 0;
    let countWithTime = 0;
    finalizadas.forEach(r => {
      if (r.start_time && r.end_time) {
        totalHours += (new Date(r.end_time) - new Date(r.start_time)) / 3600000;
        countWithTime++;
      }
    });

    res.json({
      total: rows.length,
      pendentes: rows.filter(r => r.status === 'pendente').length,
      em_execucao: rows.filter(r => r.status === 'em_execucao').length,
      finalizadas: finalizadas.length,
      revenue: finalizadas.reduce((sum, r) => sum + (r.cost_total || 0), 0),
      avg_time: countWithTime > 0 ? totalHours / countWithTime : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: order } = await supabase.from('service_orders').select(`
      *,
      tickets!service_orders_ticket_id_fkey(ticket_number, title, description),
      technician:users!service_orders_technician_id_fkey(name, phone),
      clients!service_orders_client_id_fkey(name, company, phone, email, address),
      equipment!service_orders_equipment_id_fkey(name, model, serial_number)
    `).eq('id', req.params.id).single();

    if (!order) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });

    res.json({
      ...order,
      ticket_number: order.tickets?.ticket_number,
      ticket_title: order.tickets?.title,
      ticket_description: order.tickets?.description,
      technician_name: order.technician?.name,
      technician_phone: order.technician?.phone,
      client_name: order.clients?.name,
      client_company: order.clients?.company,
      client_phone: order.clients?.phone,
      client_email: order.clients?.email,
      client_address: order.clients?.address,
      equipment_name: order.equipment?.name,
      equipment_model: order.equipment?.model,
      equipment_serial: order.equipment?.serial_number,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ticket_id, technician_id, client_id, equipment_id, diagnosis, service_performed, materials_used, observations, cost_labor, cost_materials } = req.body;
    const order_number = await generateOrderNumber();
    const cost_total = (parseFloat(cost_labor) || 0) + (parseFloat(cost_materials) || 0);

    const { data: order } = await supabase.from('service_orders').insert({
      order_number, ticket_id: ticket_id || null, technician_id: technician_id || req.user.id,
      client_id: client_id || null, equipment_id: equipment_id || null,
      diagnosis, service_performed, materials_used, observations,
      cost_labor: cost_labor || 0, cost_materials: cost_materials || 0, cost_total
    }).select().single();

    if (ticket_id) {
      await supabase.from('tickets').update({ status: 'em_andamento', updated_at: new Date().toISOString() }).eq('id', ticket_id);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: order } = await supabase.from('service_orders').select('*').eq('id', req.params.id).single();
    if (!order) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });

    const { status, start_time, end_time, diagnosis, service_performed, materials_used, observations, client_signature, technician_signature, cost_labor, cost_materials, latitude, longitude } = req.body;
    const cost_total = (parseFloat(cost_labor ?? order.cost_labor) || 0) + (parseFloat(cost_materials ?? order.cost_materials) || 0);

    const { data: updated } = await supabase.from('service_orders').update({
      status: status || order.status, start_time: start_time ?? order.start_time, end_time: end_time ?? order.end_time,
      diagnosis: diagnosis ?? order.diagnosis, service_performed: service_performed ?? order.service_performed,
      materials_used: materials_used ?? order.materials_used, observations: observations ?? order.observations,
      client_signature: client_signature ?? order.client_signature, technician_signature: technician_signature ?? order.technician_signature,
      cost_labor: cost_labor ?? order.cost_labor, cost_materials: cost_materials ?? order.cost_materials, cost_total,
      latitude: latitude ?? order.latitude, longitude: longitude ?? order.longitude, updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (status === 'finalizada' && order.ticket_id) {
      await supabase.from('tickets').update({ status: 'concluido', completed_date: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', order.ticket_id);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await supabase.from('service_orders').delete().eq('id', req.params.id);
  res.json({ message: 'Ordem de serviço excluída' });
});

module.exports = router;
