export type AssetType =
  | 'galpao'
  | 'laje_corporativa'
  | 'escritorio'
  | 'terreno'
  | 'varejo'
  | 'industrial'
  | 'hotel'
  | 'outro';

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  galpao: 'Galpão',
  laje_corporativa: 'Laje Corporativa',
  escritorio: 'Escritório',
  terreno: 'Terreno',
  varejo: 'Varejo',
  industrial: 'Industrial',
  hotel: 'Hotel',
  outro: 'Outro',
};

export type DemandStatus = 'aberta' | 'em_atendimento' | 'atendida' | 'cancelada';

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

export type AssetStatus = 'disponivel' | 'em_negociacao' | 'reservado' | 'indisponivel';

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  disponivel: 'Disponível',
  em_negociacao: 'Em Negociação',
  reservado: 'Reservado',
  indisponivel: 'Indisponível',
};

export type InstitutionType = 'fii' | 'fip' | 'varejo' | 'academia' | 'farmacia' | 'incorporadora' | 'parceiro';

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  fii: 'FII',
  fip: 'FIP',
  varejo: 'Varejo',
  academia: 'Academia',
  farmacia: 'Farmácia',
  incorporadora: 'Incorporadora',
  parceiro: 'Parceiro',
};

export interface InstitutionContact {
  id: string;
  institutionId: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  contacts?: InstitutionContact[];
  contactCount?: number;
  demandCount?: number;
  dealCount?: number;
}

export interface Demand {
  id: string;
  institutionId: string;
  institutionName?: string;
  assetType: AssetType;
  minAbl: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  capRate: number | null;
  region: string;
  status: DemandStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  address: string;
  areaM2: number | null;
  price: number | null;
  capRate: number | null;
  ownerName: string;
  driveLink: string;
  status: AssetStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  key: string;
  label: string;
  color: string;
  sortOrder: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
}

export interface DealCalendarEvent {
  id: string;
  dealId: string;
  googleEventId: string;
  titleSnapshot: string;
  startSnapshot: string | null;
  htmlLink: string;
  hangoutLink: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  institutionId: string;
  institutionName?: string;
  demandId: string;
  demandSummary?: string;
  contactId: string | null;
  contactName?: string;
  stageKey: string;
  boardPosition: number;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  driveLink: string;
  notes: string;
  assetCount?: number;
  assets?: Asset[];
  calendarEvents?: DealCalendarEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKpis {
  openPipelineValue: number;
  weightedPipelineValue: number;
  activeDemands: number;
  registeredAssets: number;
  dealsWon: number;
  dealsClosed: number;
  averageTicket: number;
  dealsByStage: { stageKey: string; count: number; value: number }[];
}
