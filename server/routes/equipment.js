const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, client_id, status, category, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('equipment').select(`
      *, clients!equipment_client_id_fkey(name, company)
    `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%,brand.ilike.%${search}%`);
    }
    if (client_id) query = query.eq('client_id', client_id);
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, count } = await query.order('name').range(offset, offset + parseInt(limit) - 1);

    const equipments = (data || []).map(e => ({
      ...e,
      client_name: e.clients?.name,
      client_company: e.clients?.company,
    }));

    res.json({ equipments, total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from('equipment').select('category').not('category', 'is', null);
    const categories = [...new Set((data || []).map(c => c.category))].sort();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: equipment } = await supabase.from('equipment').select(`
      *, clients!equipment_client_id_fkey(name, company)
    `).eq('id', req.params.id).single();

    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });

    const { data: tickets } = await supabase.from('tickets').select(`
      *, assigned:users!tickets_assigned_to_fkey(name)
    `).eq('equipment_id', req.params.id).order('created_at', { ascending: false });

    const ticketsMapped = (tickets || []).map(t => ({ ...t, assigned_name: t.assigned?.name }));

    res.json({
      ...equipment,
      client_name: equipment.clients?.name,
      client_company: equipment.clients?.company,
      tickets: ticketsMapped,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, model, serial_number, brand, category, client_id, location, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const { data: equipment, error } = await supabase.from('equipment').insert({
      name, model, serial_number, brand, category,
      client_id: client_id || null, location, status: status || 'ativo', notes
    }).select().single();

    if (error) throw error;
    res.status(201).json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, model, serial_number, brand, category, client_id, location, status, notes } = req.body;

    const { data: equipment, error } = await supabase.from('equipment').update({
      name, model, serial_number, brand, category,
      client_id: client_id || null, location, status, notes,
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('equipment').delete().eq('id', req.params.id);
    res.json({ message: 'Equipamento excluído' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
