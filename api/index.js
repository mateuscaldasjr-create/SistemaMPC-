// Vercel Serverless Entry Point
try { require('dotenv').config(); } catch(e) {}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sistema-mpc-produttivo-secret-key-2024';
process.env.NODE_ENV = 'production';

let app;
let loadError = null;

try {
  app = require('../server/app');

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeVersion: process.version,
    });
  });
} catch (err) {
  loadError = err;
  // Criar app mínimo para retornar erro útil
  const express = require('express');
  app = express();
  app.use(express.json());
  app.use((req, res) => {
    res.status(500).json({
      error: 'Erro ao inicializar servidor: ' + loadError.message,
      details: loadError.stack,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    });
  });
}

module.exports = app;
