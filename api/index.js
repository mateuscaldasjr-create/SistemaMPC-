// Vercel Serverless Entry Point
try { require('dotenv').config(); } catch(e) {}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sistema-mpc-produttivo-secret-key-2024';
process.env.NODE_ENV = 'production';

const app = require('../server/app');

// Health check para debug
const express = require('express');
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });
});

module.exports = app;
