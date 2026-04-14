const express = require('express');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase.from('clients').select('*', { count: 'exact' }).eq('active', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,document.ilike.%${search}%`);
    }

    const { data: clients, count } = await query.order('name').range(offset, offset + parseInt(limit) - 1);

    // Get ticket and equipment counts for each client
    const enriched = await Promise.all((clients || []).map(async (c) => {
      const { count: ticket_count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('client_id', c.id);
      const { count: equipment_count } = await supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('client_id', c.id);
      return { ...c, ticket_count: ticket_count || 0, equipment_count: equipment_count || 0 };
    }));

    res.json({ clients: enriched, total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: client } = await supabase.from('clients').select('*').eq('id', req.params.id).single();
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    const { data: tickets } = await supabase.from('tickets').select(`
      *, assigned:users!tickets_assigned_to_fkey(name)
    `).eq('client_id', req.params.id).order('created_at', { ascending: false });

    const { data: equipments } = await supabase.from('equipment').select('*').eq('client_id', req.params.id);

    const ticketsMapped = (tickets || []).map(t => ({ ...t, assigned_name: t.assigned?.name }));

    res.json({ ...client, tickets: ticketsMapped, equipments: equipments || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, document, company, address, city, state, zip_code, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const { data: client, error } = await supabase.from('clients').insert({
      name, email, phone, document, company, address, city, state, zip_code, notes
    }).select().single();

    if (error) throw error;
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, document, company, address, city, state, zip_code, notes } = req.body;

    const { data: client, error } = await supabase.from('clients').update({
      name, email, phone, document, company, address, city, state, zip_code, notes,
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabase.from('clients').update({ active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ message: 'Cliente desativado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
