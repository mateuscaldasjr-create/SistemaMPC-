export const statusLabels = {
  aberto: 'Aberto',
  aprovado: 'Aprovado',
  em_andamento: 'Em Andamento',
  aguardando: 'Aguardando',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  pendente: 'Pendente',
  em_execucao: 'Em Execução',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
};

export const statusColors = {
  aberto: '#3b82f6',
  aprovado: '#8b5cf6',
  em_andamento: '#f59e0b',
  aguardando: '#6b7280',
  concluido: '#10b981',
  cancelado: '#ef4444',
  pendente: '#f59e0b',
  em_execucao: '#3b82f6',
  pausada: '#6b7280',
  finalizada: '#10b981',
  cancelada: '#ef4444',
};

export const priorityLabels = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const priorityColors = {
  baixa: '#10b981',
  media: '#3b82f6',
  alta: '#f59e0b',
  urgente: '#ef4444',
};

export const typeLabels = {
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
  instalacao: 'Instalação',
  vistoria: 'Vistoria',
  outro: 'Outro',
};

export const typeIcons = {
  corretiva: 'build',
  preventiva: 'event_repeat',
  instalacao: 'add_circle',
  vistoria: 'search',
  outro: 'more_horiz',
};

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return formatDate(dateStr);
}
