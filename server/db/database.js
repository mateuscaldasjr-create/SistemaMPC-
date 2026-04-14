const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'sistema_mpc.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'tecnico' CHECK(role IN ('admin', 'gestor', 'tecnico', 'cliente')),
      phone TEXT,
      avatar TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      document TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT,
      serial_number TEXT,
      brand TEXT,
      category TEXT,
      client_id INTEGER,
      location TEXT,
      qr_code TEXT,
      status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'manutencao')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'corretiva' CHECK(type IN ('corretiva', 'preventiva', 'instalacao', 'vistoria', 'outro')),
      priority TEXT DEFAULT 'media' CHECK(priority IN ('baixa', 'media', 'alta', 'urgente')),
      status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'aprovado', 'em_andamento', 'aguardando', 'concluido', 'cancelado')),
      client_id INTEGER,
      equipment_id INTEGER,
      assigned_to INTEGER,
      created_by INTEGER,
      scheduled_date DATETIME,
      completed_date DATETIME,
      estimated_hours REAL,
      actual_hours REAL,
      cost REAL DEFAULT 0,
      address TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      ticket_id INTEGER,
      technician_id INTEGER,
      client_id INTEGER,
      equipment_id INTEGER,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'em_execucao', 'pausada', 'finalizada', 'cancelada')),
      start_time DATETIME,
      end_time DATETIME,
      diagnosis TEXT,
      service_performed TEXT,
      materials_used TEXT,
      observations TEXT,
      client_signature TEXT,
      technician_signature TEXT,
      photos TEXT,
      latitude REAL,
      longitude REAL,
      cost_labor REAL DEFAULT 0,
      cost_materials REAL DEFAULT 0,
      cost_total REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      comment TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      items TEXT NOT NULL,
      created_by INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      ticket_id INTEGER,
      technician_id INTEGER,
      client_id INTEGER,
      start_date DATETIME NOT NULL,
      end_date DATETIME,
      recurrence TEXT CHECK(recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
      status TEXT DEFAULT 'agendado' CHECK(status IN ('agendado', 'confirmado', 'realizado', 'cancelado')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Seed admin user if none exists
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run('Administrador', 'admin@sistemampc.com', hashedPassword, 'admin', '(11) 99999-9999');

    // Seed sample data
    seedSampleData();
  }
}

function seedSampleData() {
  // Sample clients
  const insertClient = db.prepare(`
    INSERT INTO clients (name, email, phone, document, company, address, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertClient.run('João Silva', 'joao@empresa.com', '(11) 98765-4321', '12.345.678/0001-99', 'Tech Solutions Ltda', 'Rua Augusta, 1500', 'São Paulo', 'SP');
  insertClient.run('Maria Santos', 'maria@industria.com', '(21) 97654-3210', '98.765.432/0001-11', 'Indústria Santos S.A.', 'Av. Brasil, 2000', 'Rio de Janeiro', 'RJ');
  insertClient.run('Carlos Oliveira', 'carlos@predial.com', '(31) 96543-2109', '45.678.901/0001-22', 'Predial Oliveira', 'Rua da Bahia, 800', 'Belo Horizonte', 'MG');
  insertClient.run('Ana Costa', 'ana@hospital.com', '(41) 95432-1098', '67.890.123/0001-33', 'Hospital Central', 'Av. Sete de Setembro, 500', 'Curitiba', 'PR');
  insertClient.run('Pedro Almeida', 'pedro@condominios.com', '(51) 94321-0987', '23.456.789/0001-44', 'Condomínios Premium', 'Rua dos Andradas, 1200', 'Porto Alegre', 'RS');

  // Sample technicians
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('tech123', 10);
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('Roberto Técnico', 'roberto@sistemampc.com', hashedPassword, 'tecnico', '(11) 91234-5678');
  insertUser.run('Fernanda Técnica', 'fernanda@sistemampc.com', hashedPassword, 'tecnico', '(11) 92345-6789');
  insertUser.run('Lucas Gestor', 'lucas@sistemampc.com', hashedPassword, 'gestor', '(11) 93456-7890');

  // Sample equipment
  const insertEquip = db.prepare(`
    INSERT INTO equipment (name, model, serial_number, brand, category, client_id, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEquip.run('Ar Condicionado Split', 'Inverter 12000BTU', 'AC-2024-001', 'Samsung', 'HVAC', 1, 'Sala 301', 'ativo');
  insertEquip.run('Elevador Social', 'Atlas Schindler 3300', 'ELV-2024-001', 'Atlas Schindler', 'Elevadores', 3, 'Bloco A', 'ativo');
  insertEquip.run('Gerador de Energia', 'Cummins C150D5', 'GER-2024-001', 'Cummins', 'Energia', 4, 'Subsolo', 'manutencao');
  insertEquip.run('Sistema de CFTV', 'DVR 32 Canais', 'CFTV-2024-001', 'Intelbras', 'Segurança', 5, 'Portaria', 'ativo');

  // Sample tickets
  const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_number, title, description, type, priority, status, client_id, equipment_id, assigned_to, created_by, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run('CHM-2024-0001', 'Ar condicionado não refrigera', 'Cliente reporta que o ar condicionado da sala 301 não está refrigerando adequadamente.', 'corretiva', 'alta', 'aberto', 1, 1, 2, 1, '2024-12-20 09:00:00');
  insertTicket.run('CHM-2024-0002', 'Manutenção preventiva elevador', 'Manutenção mensal preventiva do elevador social do Bloco A.', 'preventiva', 'media', 'em_andamento', 3, 2, 2, 1, '2024-12-18 14:00:00');
  insertTicket.run('CHM-2024-0003', 'Gerador com falha na partida', 'Gerador apresenta dificuldade na partida automática durante teste semanal.', 'corretiva', 'urgente', 'aberto', 4, 3, 3, 1, '2024-12-19 08:00:00');
  insertTicket.run('CHM-2024-0004', 'Instalação de câmeras adicionais', 'Instalar 4 câmeras adicionais no estacionamento.', 'instalacao', 'baixa', 'aprovado', 5, 4, 3, 1, '2024-12-22 10:00:00');
  insertTicket.run('CHM-2024-0005', 'Vistoria técnica anual', 'Vistoria técnica anual em todos os equipamentos do cliente.', 'vistoria', 'media', 'concluido', 2, null, 2, 1, '2024-12-15 09:00:00');
  insertTicket.run('CHM-2024-0006', 'Troca de filtro do ar condicionado', 'Trocar filtro do ar condicionado conforme agendamento preventivo.', 'preventiva', 'baixa', 'concluido', 1, 1, 2, 1, '2024-12-10 11:00:00');
  insertTicket.run('CHM-2024-0007', 'Reparo elétrico na iluminação', 'Lâmpadas do corredor do 3º andar queimadas e fiação com defeito.', 'corretiva', 'media', 'em_andamento', 3, null, 3, 1, '2024-12-17 15:00:00');
  insertTicket.run('CHM-2024-0008', 'Sistema CFTV offline', 'DVR parou de gravar e 5 câmeras estão offline.', 'corretiva', 'urgente', 'aberto', 5, 4, null, 1, null);

  // Sample service orders
  const insertSO = db.prepare(`
    INSERT INTO service_orders (order_number, ticket_id, technician_id, client_id, equipment_id, status, start_time, end_time, diagnosis, service_performed, cost_labor, cost_materials, cost_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSO.run('OS-2024-0001', 5, 2, 2, null, 'finalizada', '2024-12-15 09:00:00', '2024-12-15 17:00:00', 'Todos os equipamentos em conformidade', 'Vistoria completa com checklist de 45 itens', 800, 0, 800);
  insertSO.run('OS-2024-0002', 6, 2, 1, 1, 'finalizada', '2024-12-10 11:00:00', '2024-12-10 12:30:00', 'Filtro saturado', 'Troca do filtro e limpeza geral do equipamento', 150, 85, 235);
  insertSO.run('OS-2024-0003', 2, 2, 3, 2, 'em_execucao', '2024-12-18 14:00:00', null, 'Manutenção preventiva em andamento', 'Verificação de cabos, motor e sistema de freio', 500, 200, 700);
}

module.exports = { db, initializeDatabase };
