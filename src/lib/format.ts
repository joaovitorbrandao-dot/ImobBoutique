export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export const formatCurrencyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return formatCurrency(value);
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const formatArea = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('pt-BR')} m²`;
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('pt-BR')}%`;
};
