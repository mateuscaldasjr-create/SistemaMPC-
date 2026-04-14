const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, technician_id, status } = req.query;

    let query = supabase.from('schedules').select(`
      *,
      technician:users!schedules_technician_id_fkey(name),
      clients!schedules_client_id_fkey(name),
      tickets!schedules_ticket_id_fkey(ticket_number)
    `);

    if (start_date) query = query.gte('start_date', start_date);
    if (end_date) query = query.lte('start_date', end_date);
    if (technician_id) query = query.eq('technician_id', technician_id);
    if (status) query = query.eq('status', status);

    const { data } = await query.order('start_date');

    const schedules = (data || []).map(s => ({
      ...s,
      technician_name: s.technician?.name,
      client_name: s.clients?.name,
      ticket_number: s.tickets?.ticket_number,
    }));

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, ticket_id, technician_id, client_id, start_date, end_date, recurrence } = req.body;
    if (!title || !start_date) return res.status(400).json({ error: 'Título e data são obrigatórios' });

    const { data: schedule, error } = await supabase.from('schedules').insert({
      title, description,
      ticket_id: ticket_id || null,
      technician_id: technician_id || null,
      client_id: client_id || null,
      start_date, end_date,
      recurrence: recurrence || 'none'
    }).select().single();

    if (error) throw error;
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, technician_id, client_id, start_date, end_date, recurrence, status } = req.body;

    const { data: schedule, error } = await supabase.from('schedules').update({
      title, description, technician_id, client_id,
      start_date, end_date, recurrence, status
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('schedules').delete().eq('id', req.params.id);
    res.json({ message: 'Agendamento excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
