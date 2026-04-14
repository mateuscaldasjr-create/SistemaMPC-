const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, search, active } = req.query;

    let query = supabase.from('users').select('id, name, email, role, phone, active, created_at');

    if (role) query = query.eq('role', role);
    if (active !== undefined) query = query.eq('active', active === 'true' || active === '1');
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: users } = await query.order('name');

    // Get ticket counts for each user
    const enriched = await Promise.all((users || []).map(async (u) => {
      const { count: ticket_count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);
      const { count: completed_count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('assigned_to', u.id).eq('status', 'concluido');
      return { ...u, ticket_count: ticket_count || 0, completed_count: completed_count || 0 };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/technicians', authMiddleware, async (req, res) => {
  try {
    const { data: technicians } = await supabase.from('users')
      .select('id, name, email, phone, role')
      .in('role', ['tecnico', 'gestor', 'admin'])
      .eq('active', true)
      .order('name');

    const enriched = await Promise.all((technicians || []).map(async (t) => {
      const { count: active_tickets } = await supabase.from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', t.id)
        .not('status', 'in', '(concluido,cancelado)');
      return { ...t, active_tickets: active_tickets || 0 };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users')
      .select('id, name, email, role, phone, active, created_at')
      .eq('id', req.params.id).single();

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data: user, error } = await supabase.from('users').insert({
      name, email, password: hashedPassword, role: role || 'tecnico', phone
    }).select('id, name, email, role, phone, active, created_at').single();

    if (error) throw error;
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, role, phone, active, password } = req.body;

    const updates = {
      name, email, role, phone, active: active ?? true,
      updated_at: new Date().toISOString()
    };

    if (password) {
      updates.password = bcrypt.hashSync(password, 10);
    }

    const { data: user, error } = await supabase.from('users').update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, phone, active, created_at').single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await supabase.from('users').update({ active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ message: 'Usuário desativado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
