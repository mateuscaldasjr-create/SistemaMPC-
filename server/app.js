const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/service-orders', require('./routes/serviceOrders'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/schedules', require('./routes/schedules'));

// Servir frontend em produção
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

module.exports = app;
