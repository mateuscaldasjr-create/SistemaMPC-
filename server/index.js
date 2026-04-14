require('dotenv').config();
const app = require('./app');
require('./db/database').initializeDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 MPC Service rodando na porta ${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`👤 Login: admin@sistemampc.com / admin123`);
});
