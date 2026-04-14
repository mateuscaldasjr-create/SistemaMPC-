-- =============================================
-- MPC Service - Schema Supabase (PostgreSQL)
-- Execute no SQL Editor do Supabase
-- =============================================

-- Usuários do sistema (admin, gestor, técnico)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tecnico' CHECK(role IN ('admin', 'gestor', 'tecnico', 'cliente')),
  phone TEXT,
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
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
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipamentos
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  brand TEXT,
  category TEXT,
  client_id INTEGER REFERENCES clients(id),
  location TEXT,
  qr_code TEXT,
  status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo', 'manutencao')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chamados
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'corretiva' CHECK(type IN ('corretiva', 'preventiva', 'instalacao', 'vistoria', 'outro')),
  priority TEXT DEFAULT 'media' CHECK(priority IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'aprovado', 'em_andamento', 'aguardando', 'concluido', 'cancelado')),
  client_id INTEGER REFERENCES clients(id),
  equipment_id INTEGER REFERENCES equipment(id),
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  estimated_hours REAL,
  actual_hours REAL,
  cost REAL DEFAULT 0,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ordens de Serviço
CREATE TABLE IF NOT EXISTS service_orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  ticket_id INTEGER REFERENCES tickets(id),
  technician_id INTEGER REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  equipment_id INTEGER REFERENCES equipment(id),
  status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'em_execucao', 'pausada', 'finalizada', 'cancelada')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários dos chamados
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico dos chamados
CREATE TABLE IF NOT EXISTS ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates de checklist
CREATE TABLE IF NOT EXISTS checklist_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  items TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ticket_id INTEGER REFERENCES tickets(id),
  technician_id INTEGER REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  recurrence TEXT CHECK(recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  status TEXT DEFAULT 'agendado' CHECK(status IN ('agendado', 'confirmado', 'realizado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_ticket ON service_orders(ticket_id);
CREATE INDEX IF NOT EXISTS idx_equipment_client ON equipment(client_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(start_date);

-- Desabilitar RLS para acesso via service_role key (API server-side)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total via service_role
CREATE POLICY "Allow service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON service_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON ticket_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON ticket_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON schedules FOR ALL USING (true) WITH CHECK (true);
