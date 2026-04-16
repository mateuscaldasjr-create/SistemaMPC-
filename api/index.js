// Vercel Serverless Entry Point
try { require('dotenv').config(); } catch(e) {}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sistema-mpc-produttivo-secret-key-2024';
process.env.NODE_ENV = 'production';

let app;
let loadError = null;
let loadStep = 'inicio';

try {
  loadStep = 'express';
  const express = require('express');

  loadStep = 'cors';
  const cors = require('cors');

  loadStep = 'supabase';
  require('@supabase/supabase-js');

  loadStep = 'bcryptjs';
  require('bcryptjs');

  loadStep = 'jsonwebtoken';
  require('jsonwebtoken');

  loadStep = 'server/app';
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
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Falha no passo: ' + loadStep,
      message: loadError.message,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      nodeVersion: process.version,
    });
  });
}

module.exports = app;
