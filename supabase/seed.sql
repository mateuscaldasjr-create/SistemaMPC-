-- =============================================
-- MPC Service - Dados de Exemplo
-- Execute APÓS o schema.sql
-- Senha admin: admin123 | Senha técnicos: tech123
-- =============================================

-- Admin (senha: admin123 - bcrypt hash)
INSERT INTO users (name, email, password, role, phone) VALUES
('Administrador', 'admin@sistemampc.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9XrKz5Gh1VDC3G3sSYjGFGhk2y', 'admin', '(11) 99999-9999');

-- Técnicos (senha: tech123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Roberto Técnico', 'roberto@sistemampc.com', '$2a$10$YQiKlKOMgVGFa1GjfSy0/.XqFVkGZCdNfnJHGJsHqOPwBqeZUzm/O', 'tecnico', '(11) 91234-5678'),
('Fernanda Técnica', 'fernanda@sistemampc.com', '$2a$10$YQiKlKOMgVGFa1GjfSy0/.XqFVkGZCdNfnJHGJsHqOPwBqeZUzm/O', 'tecnico', '(11) 92345-6789'),
('Lucas Gestor', 'lucas@sistemampc.com', '$2a$10$YQiKlKOMgVGFa1GjfSy0/.XqFVkGZCdNfnJHGJsHqOPwBqeZUzm/O', 'gestor', '(11) 93456-7890');

-- Clientes
INSERT INTO clients (name, email, phone, document, company, address, city, state) VALUES
('João Silva', 'joao@empresa.com', '(11) 98765-4321', '12.345.678/0001-99', 'Tech Solutions Ltda', 'Rua Augusta, 1500', 'São Paulo', 'SP'),
('Maria Santos', 'maria@industria.com', '(21) 97654-3210', '98.765.432/0001-11', 'Indústria Santos S.A.', 'Av. Brasil, 2000', 'Rio de Janeiro', 'RJ'),
('Carlos Oliveira', 'carlos@predial.com', '(31) 96543-2109', '45.678.901/0001-22', 'Predial Oliveira', 'Rua da Bahia, 800', 'Belo Horizonte', 'MG'),
('Ana Costa', 'ana@hospital.com', '(41) 95432-1098', '67.890.123/0001-33', 'Hospital Central', 'Av. Sete de Setembro, 500', 'Curitiba', 'PR'),
('Pedro Almeida', 'pedro@condominios.com', '(51) 94321-0987', '23.456.789/0001-44', 'Condomínios Premium', 'Rua dos Andradas, 1200', 'Porto Alegre', 'RS');

-- Equipamentos
INSERT INTO equipment (name, model, serial_number, brand, category, client_id, location, status) VALUES
('Ar Condicionado Split', 'Inverter 12000BTU', 'AC-2024-001', 'Samsung', 'HVAC', 1, 'Sala 301', 'ativo'),
('Elevador Social', 'Atlas Schindler 3300', 'ELV-2024-001', 'Atlas Schindler', 'Elevadores', 3, 'Bloco A', 'ativo'),
('Gerador de Energia', 'Cummins C150D5', 'GER-2024-001', 'Cummins', 'Energia', 4, 'Subsolo', 'manutencao'),
('Sistema de CFTV', 'DVR 32 Canais', 'CFTV-2024-001', 'Intelbras', 'Segurança', 5, 'Portaria', 'ativo');

-- Chamados
INSERT INTO tickets (ticket_number, title, description, type, priority, status, client_id, equipment_id, assigned_to, created_by, scheduled_date) VALUES
('CHM-2024-0001', 'Ar condicionado não refrigera', 'Cliente reporta que o ar condicionado da sala 301 não está refrigerando adequadamente.', 'corretiva', 'alta', 'aberto', 1, 1, 2, 1, '2024-12-20 09:00:00'),
('CHM-2024-0002', 'Manutenção preventiva elevador', 'Manutenção mensal preventiva do elevador social do Bloco A.', 'preventiva', 'media', 'em_andamento', 3, 2, 2, 1, '2024-12-18 14:00:00'),
('CHM-2024-0003', 'Gerador com falha na partida', 'Gerador apresenta dificuldade na partida automática durante teste semanal.', 'corretiva', 'urgente', 'aberto', 4, 3, 3, 1, '2024-12-19 08:00:00'),
('CHM-2024-0004', 'Instalação de câmeras adicionais', 'Instalar 4 câmeras adicionais no estacionamento.', 'instalacao', 'baixa', 'aprovado', 5, 4, 3, 1, '2024-12-22 10:00:00'),
('CHM-2024-0005', 'Vistoria técnica anual', 'Vistoria técnica anual em todos os equipamentos do cliente.', 'vistoria', 'media', 'concluido', 2, NULL, 2, 1, '2024-12-15 09:00:00'),
('CHM-2024-0006', 'Troca de filtro do ar condicionado', 'Trocar filtro do ar condicionado conforme agendamento preventivo.', 'preventiva', 'baixa', 'concluido', 1, 1, 2, 1, '2024-12-10 11:00:00'),
('CHM-2024-0007', 'Reparo elétrico na iluminação', 'Lâmpadas do corredor do 3º andar queimadas e fiação com defeito.', 'corretiva', 'media', 'em_andamento', 3, NULL, 3, 1, '2024-12-17 15:00:00'),
('CHM-2024-0008', 'Sistema CFTV offline', 'DVR parou de gravar e 5 câmeras estão offline.', 'corretiva', 'urgente', 'aberto', 5, 4, NULL, 1, NULL);

-- Ordens de Serviço
INSERT INTO service_orders (order_number, ticket_id, technician_id, client_id, equipment_id, status, start_time, end_time, diagnosis, service_performed, cost_labor, cost_materials, cost_total) VALUES
('OS-2024-0001', 5, 2, 2, NULL, 'finalizada', '2024-12-15 09:00:00', '2024-12-15 17:00:00', 'Todos os equipamentos em conformidade', 'Vistoria completa com checklist de 45 itens', 800, 0, 800),
('OS-2024-0002', 6, 2, 1, 1, 'finalizada', '2024-12-10 11:00:00', '2024-12-10 12:30:00', 'Filtro saturado', 'Troca do filtro e limpeza geral do equipamento', 150, 85, 235),
('OS-2024-0003', 2, 2, 3, 2, 'em_execucao', '2024-12-18 14:00:00', NULL, 'Manutenção preventiva em andamento', 'Verificação de cabos, motor e sistema de freio', 500, 200, 700);
