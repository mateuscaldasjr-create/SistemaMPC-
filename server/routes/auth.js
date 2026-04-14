const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);
  if (!user) {
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
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, avatar, active, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone, current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (new_password) {
    if (!current_password || !bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET name = ?, phone = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name || user.name, phone || user.phone, hashedPassword, req.user.id);
  } else {
    db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name || user.name, phone || user.phone, req.user.id);
  }

  const updatedUser = db.prepare('SELECT id, name, email, role, phone, avatar, active, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(updatedUser);
});

module.exports = router;
