import {
  Institution,
  InstitutionContact,
  Demand,
  Asset,
  PipelineStage,
  Deal,
  DealCalendarEvent,
  DashboardKpis,
  ASSET_TYPE_LABELS,
} from '../types';

// All Supabase access goes through our own backend (server.ts/api/index.ts),
// which holds the Supabase URL/anon key server-side. The browser never sees
// Supabase credentials directly — only the user's own session bearer token.

const TOKEN_KEY = 'imobboutique_auth_token';

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonHeaders = (): Record<string, string> => ({ 'Content-Type': 'application/json', ...authHeaders() });

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { ...jsonHeaders(), ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erro inesperado');
  return data;
}

// URLSearchParams stringifies `undefined` as the literal text "undefined",
// so omitted/empty filters must be dropped here rather than passed through —
// otherwise an unset filter becomes e.g. "?status=undefined" server-side.
const buildQueryString = (params?: Record<string, string | undefined>): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`;
};

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const storeToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const login = async (email: string, password: string): Promise<{ id?: string; email?: string }> => {
  const data = await request<{ accessToken: string; user: { id?: string; email?: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  storeToken(data.accessToken);
  return data.user;
};

export const validateSession = async (): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------
// Mapping helpers — snake_case DB rows -> camelCase TS objects
// ---------------------------------------------------------------------

const embedCount = (embed: any): number => (Array.isArray(embed) && embed[0]?.count) || 0;

const mapContact = (row: any): InstitutionContact => ({
  id: row.id,
  institutionId: row.institution_id,
  name: row.name,
  roleTitle: row.role_title || '',
  email: row.email || '',
  phone: row.phone || '',
  isPrimary: !!row.is_primary,
  notes: row.notes || '',
  createdAt: row.created_at,
});

const mapInstitution = (row: any): Institution => ({
  id: row.id,
  name: row.name,
  segment: row.segment || '',
  notes: row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  contacts: Array.isArray(row.institution_contacts) && row.institution_contacts[0]?.id
    ? row.institution_contacts.map(mapContact)
    : undefined,
  contactCount: Array.isArray(row.institution_contacts) && row.institution_contacts[0]?.id
    ? row.institution_contacts.length
    : embedCount(row.institution_contacts),
  demandCount: embedCount(row.demands),
  dealCount: embedCount(row.deals),
});

const mapDemand = (row: any): Demand => ({
  id: row.id,
  institutionId: row.institution_id,
  institutionName: row.institutions?.name,
  assetType: row.asset_type,
  budgetMin: row.budget_min !== null && row.budget_min !== undefined ? Number(row.budget_min) : null,
  budgetMax: row.budget_max !== null && row.budget_max !== undefined ? Number(row.budget_max) : null,
  region: row.region || '',
  status: row.status,
  notes: row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAsset = (row: any): Asset => ({
  id: row.id,
  type: row.type,
  address: row.address,
  areaM2: row.area_m2 !== null && row.area_m2 !== undefined ? Number(row.area_m2) : null,
  price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
  capRate: row.cap_rate !== null && row.cap_rate !== undefined ? Number(row.cap_rate) : null,
  ownerName: row.owner_name || '',
  driveLink: row.drive_link || '',
  status: row.status,
  notes: row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPipelineStage = (row: any): PipelineStage => ({
  key: row.key,
  label: row.label,
  color: row.color,
  sortOrder: row.sort_order,
  isClosedWon: !!row.is_closed_won,
  isClosedLost: !!row.is_closed_lost,
});

const mapCalendarEvent = (row: any): DealCalendarEvent => ({
  id: row.id,
  dealId: row.deal_id,
  googleEventId: row.google_event_id,
  titleSnapshot: row.title_snapshot || '',
  startSnapshot: row.start_snapshot,
  htmlLink: row.html_link || '',
  hangoutLink: row.hangout_link || '',
  createdAt: row.created_at,
});

const demandSummary = (demand: any): string => {
  if (!demand) return '';
  const label = ASSET_TYPE_LABELS[demand.asset_type as keyof typeof ASSET_TYPE_LABELS] || demand.asset_type;
  return label;
};

const mapDeal = (row: any): Deal => ({
  id: row.id,
  institutionId: row.institution_id,
  institutionName: row.institutions?.name,
  demandId: row.demand_id,
  demandSummary: demandSummary(row.demands),
  contactId: row.contact_id,
  contactName: row.institution_contacts?.name,
  stageKey: row.stage_key,
  boardPosition: row.board_position,
  value: Number(row.value || 0),
  probability: Number(row.probability ?? 50),
  expectedCloseDate: row.expected_close_date,
  driveLink: row.drive_link || '',
  notes: row.notes || '',
  assetCount: Array.isArray(row.deal_assets) ? row.deal_assets.length : 0,
  assets: Array.isArray(row.deal_assets) && row.deal_assets[0]?.assets
    ? row.deal_assets.map((da: any) => mapAsset(da.assets)).filter(Boolean)
    : undefined,
  calendarEvents: Array.isArray(row.deal_calendar_events) ? row.deal_calendar_events.map(mapCalendarEvent) : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ---------------------------------------------------------------------
// Institutions
// ---------------------------------------------------------------------

export const fetchInstitutions = async (params?: { search?: string; segment?: string }): Promise<Institution[]> => {
  const data = await request<{ institutions: any[] }>(`/api/institutions${buildQueryString(params)}`);
  return data.institutions.map(mapInstitution);
};

export const fetchInstitution = async (id: string): Promise<Institution> => {
  const data = await request<{ institution: any }>(`/api/institutions/${id}`);
  return mapInstitution(data.institution);
};

export const createInstitution = async (payload: { name: string; segment: string; notes: string }): Promise<Institution> => {
  const data = await request<{ institution: any }>('/api/institutions', { method: 'POST', body: JSON.stringify(payload) });
  return mapInstitution(data.institution);
};

export const updateInstitution = async (id: string, payload: { name: string; segment: string; notes: string }): Promise<Institution> => {
  const data = await request<{ institution: any }>(`/api/institutions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return mapInstitution(data.institution);
};

export const deleteInstitution = async (id: string): Promise<void> => {
  await request(`/api/institutions/${id}`, { method: 'DELETE' });
};

export const fetchContacts = async (institutionId: string): Promise<InstitutionContact[]> => {
  const data = await request<{ contacts: any[] }>(`/api/institutions/${institutionId}/contacts`);
  return data.contacts.map(mapContact);
};

export const createContact = async (
  institutionId: string,
  payload: { name: string; roleTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }
): Promise<InstitutionContact> => {
  const data = await request<{ contact: any }>(`/api/institutions/${institutionId}/contacts`, { method: 'POST', body: JSON.stringify(payload) });
  return mapContact(data.contact);
};

export const updateContact = async (
  institutionId: string,
  contactId: string,
  payload: { name: string; roleTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }
): Promise<InstitutionContact> => {
  const data = await request<{ contact: any }>(`/api/institutions/${institutionId}/contacts/${contactId}`, { method: 'PUT', body: JSON.stringify(payload) });
  return mapContact(data.contact);
};

export const deleteContact = async (institutionId: string, contactId: string): Promise<void> => {
  await request(`/api/institutions/${institutionId}/contacts/${contactId}`, { method: 'DELETE' });
};

// ---------------------------------------------------------------------
// Demands
// ---------------------------------------------------------------------

export const fetchDemands = async (params?: { institution_id?: string; status?: string; asset_type?: string }): Promise<Demand[]> => {
  const data = await request<{ demands: any[] }>(`/api/demands${buildQueryString(params)}`);
  return data.demands.map(mapDemand);
};

export const createDemand = async (payload: {
  institutionId: string; assetType: string; budgetMin: number | null; budgetMax: number | null; region: string; status: string; notes: string;
}): Promise<Demand> => {
  const data = await request<{ demand: any }>('/api/demands', { method: 'POST', body: JSON.stringify(payload) });
  return mapDemand(data.demand);
};

export const updateDemand = async (id: string, payload: {
  institutionId: string; assetType: string; budgetMin: number | null; budgetMax: number | null; region: string; status: string; notes: string;
}): Promise<Demand> => {
  const data = await request<{ demand: any }>(`/api/demands/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return mapDemand(data.demand);
};

export const deleteDemand = async (id: string): Promise<void> => {
  await request(`/api/demands/${id}`, { method: 'DELETE' });
};

// ---------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------

export const fetchAssets = async (params?: { type?: string; status?: string; search?: string }): Promise<Asset[]> => {
  const data = await request<{ assets: any[] }>(`/api/assets${buildQueryString(params)}`);
  return data.assets.map(mapAsset);
};

export const createAsset = async (payload: {
  type: string; address: string; areaM2: number | null; price: number | null; capRate: number | null; ownerName: string; driveLink: string; status: string; notes: string;
}): Promise<Asset> => {
  const data = await request<{ asset: any }>('/api/assets', { method: 'POST', body: JSON.stringify(payload) });
  return mapAsset(data.asset);
};

export const updateAsset = async (id: string, payload: {
  type: string; address: string; areaM2: number | null; price: number | null; capRate: number | null; ownerName: string; driveLink: string; status: string; notes: string;
}): Promise<Asset> => {
  const data = await request<{ asset: any }>(`/api/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return mapAsset(data.asset);
};

export const deleteAsset = async (id: string): Promise<void> => {
  await request(`/api/assets/${id}`, { method: 'DELETE' });
};

// ---------------------------------------------------------------------
// Pipeline stages & deals
// ---------------------------------------------------------------------

export const fetchPipelineStages = async (): Promise<PipelineStage[]> => {
  const data = await request<{ stages: any[] }>('/api/pipeline-stages');
  return data.stages.map(mapPipelineStage);
};

export const fetchDeals = async (): Promise<Deal[]> => {
  const data = await request<{ deals: any[] }>('/api/deals');
  return data.deals.map(mapDeal);
};

export const fetchDeal = async (id: string): Promise<Deal> => {
  const data = await request<{ deal: any }>(`/api/deals/${id}`);
  return mapDeal(data.deal);
};

export const createDeal = async (payload: {
  institutionId: string; demandId: string; contactId: string | null; stageKey: string;
  value: number; probability: number; expectedCloseDate: string | null; driveLink: string; notes: string;
}): Promise<Deal> => {
  const data = await request<{ deal: any }>('/api/deals', { method: 'POST', body: JSON.stringify(payload) });
  return mapDeal(data.deal);
};

export const updateDeal = async (id: string, payload: {
  institutionId: string; demandId: string; contactId: string | null;
  value: number; probability: number; expectedCloseDate: string | null; driveLink: string; notes: string;
}): Promise<Deal> => {
  const data = await request<{ deal: any }>(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return mapDeal(data.deal);
};

export const reorderDeals = async (stageKey: string, orderedDealIds: string[]): Promise<void> => {
  await request('/api/deals/reorder', { method: 'PATCH', body: JSON.stringify({ stageKey, orderedDealIds }) });
};

export const deleteDeal = async (id: string): Promise<void> => {
  await request(`/api/deals/${id}`, { method: 'DELETE' });
};

export const attachAssetToDeal = async (dealId: string, assetId: string): Promise<void> => {
  await request(`/api/deals/${dealId}/assets`, { method: 'POST', body: JSON.stringify({ assetId }) });
};

export const detachAssetFromDeal = async (dealId: string, assetId: string): Promise<void> => {
  await request(`/api/deals/${dealId}/assets/${assetId}`, { method: 'DELETE' });
};

export const createDealCalendarEvent = async (dealId: string, payload: {
  googleEventId: string; titleSnapshot: string; startSnapshot: string | null; htmlLink: string; hangoutLink: string;
}): Promise<DealCalendarEvent> => {
  const data = await request<{ event: any }>(`/api/deals/${dealId}/calendar-events`, { method: 'POST', body: JSON.stringify(payload) });
  return mapCalendarEvent(data.event);
};

export const deleteDealCalendarEvent = async (dealId: string, refId: string): Promise<void> => {
  await request(`/api/deals/${dealId}/calendar-events/${refId}`, { method: 'DELETE' });
};

export const fetchUpcomingEvents = async (): Promise<(DealCalendarEvent & { dealInstitution?: string; dealAssetType?: string })[]> => {
  const data = await request<{ events: any[] }>('/api/calendar-events/upcoming');
  return data.events.map((row) => ({
    ...mapCalendarEvent(row),
    dealInstitution: row.deals?.institutions?.name,
    dealAssetType: row.deals?.demands?.asset_type,
  }));
};

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------

export const fetchDashboardKpis = async (): Promise<DashboardKpis> => {
  const data = await request<{ kpis: DashboardKpis }>('/api/dashboard/kpis');
  return data.kpis;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/supabase/status');
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro de rede ou conexão inválida.' };
  }
};
