// Vercel Serverless Entry Point
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sistema-mpc-produttivo-secret-key-2024';
process.env.NODE_ENV = 'production';

const app = require('../server/app');

module.exports = app;
