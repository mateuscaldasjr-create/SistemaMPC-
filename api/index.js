// Vercel Serverless Entry Point
// Set env before any requires
process.env.JWT_SECRET = process.env.JWT_SECRET || 'sistema-mpc-produttivo-secret-key-2024';
process.env.NODE_ENV = 'production';

const app = require('../server/app');

// Ensure DB is initialized on first request
require('../server/db/database').initializeDatabase();

module.exports = app;
