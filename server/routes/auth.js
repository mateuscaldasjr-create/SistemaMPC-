const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email).eq('active', true).single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const { data: user } = await supabase
    .from('users').select('id, name, email, role, phone, avatar, active, created_at')
    .eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone, current_password, new_password } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  updates.updated_at = new Date().toISOString();

  if (new_password) {
    const { data: user } = await supabase.from('users').select('password').eq('id', req.user.id).single();
    if (!current_password || !bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    updates.password = bcrypt.hashSync(new_password, 10);
  }

  await supabase.from('users').update(updates).eq('id', req.user.id);

  const { data: updatedUser } = await supabase
    .from('users').select('id, name, email, role, phone, avatar, active, created_at')
    .eq('id', req.user.id).single();
  res.json(updatedUser);
});

module.exports = router;
