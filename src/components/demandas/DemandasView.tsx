import { useEffect, useState } from 'react';
import { Plus, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { Demand, Institution, AssetType, DemandStatus, ASSET_TYPE_LABELS, DEMAND_STATUS_LABELS } from '../../types';
import { fetchDemands, fetchInstitutions, createDemand, updateDemand, deleteDemand } from '../../lib/supabase';
import { formatCurrencyCompact } from '../../lib/format';
import DemandFormModal from './DemandFormModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';

const STATUS_CHIP: Record<DemandStatus, string> = {
  aberta: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  em_atendimento: 'bg-amber-50 text-amber-700 border-amber-200',
  atendida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelada: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function DemandasView() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [institutionFilter, setInstitutionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Demand | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [demandsData, institutionsData] = await Promise.all([
        fetchDemands({
          institution_id: institutionFilter || undefined,
          status: statusFilter || undefined,
          asset_type: assetTypeFilter || undefined,
        }),
        institutions.length ? Promise.resolve(institutions) : fetchInstitutions(),
      ]);
      setDemands(demandsData);
      if (!institutions.length) setInstitutions(institutionsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar demandas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [institutionFilter, statusFilter, assetTypeFilter]);

  const handleSave = async (payload: {
    institutionId: string; assetType: AssetType; budgetMin: number | null; budgetMax: number | null; region: string; status: DemandStatus; notes: string;
  }) => {
    if (editingDemand) await updateDemand(editingDemand.id, payload);
    else await createDemand(payload);
    await load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError('');
    try {
      await deleteDemand(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir demanda.');
    }
  };

  const budgetLabel = (demand: Demand) => {
    if (demand.budgetMin && demand.budgetMax) return `${formatCurrencyCompact(demand.budgetMin)} – ${formatCurrencyCompact(demand.budgetMax)}`;
    if (demand.budgetMax) return `até ${formatCurrencyCompact(demand.budgetMax)}`;
    if (demand.budgetMin) return `a partir de ${formatCurrencyCompact(demand.budgetMin)}`;
    return '—';
  };

  return (
    <div className="space-y-5 animate-fade-in" id="demandas-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-md flex-wrap">
        <div className="flex flex-wrap gap-2">
          <select
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
            className="text-xs bg-slate-100 border-0 rounded-lg px-3 py-2 font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Todas as instituições</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            className="text-xs bg-slate-100 border-0 rounded-lg px-3 py-2 font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-100 border-0 rounded-lg px-3 py-2 font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Todos os status</option>
            {Object.entries(DEMAND_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingDemand(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Demanda
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button onClick={load} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : demands.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma demanda cadastrada"
          description="Cadastre o que um cliente institucional está buscando para vincular à carteira."
          action={{ label: 'Nova Demanda', onClick: () => setIsFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {demands.map((demand) => (
            <div key={demand.id} className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">{demand.institutionName}</p>
                  <p className="text-[10.5px] text-slate-400 font-bold mt-0.5">{ASSET_TYPE_LABELS[demand.assetType]}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CHIP[demand.status]}`}>
                  {DEMAND_STATUS_LABELS[demand.status]}
                </span>
              </div>

              <div className="text-xs text-slate-600 font-semibold">{budgetLabel(demand)}</div>
              {demand.region && <div className="text-[11px] text-slate-400 font-medium">{demand.region}</div>}
              {demand.notes && <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{demand.notes}</p>}

              <div className="flex justify-end gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEditingDemand(demand);
                    setIsFormOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button onClick={() => setPendingDelete(demand)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DemandFormModal
        isOpen={isFormOpen}
        demand={editingDemand}
        institutions={institutions}
        defaultInstitutionId={institutionFilter || undefined}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Excluir demanda?"
        message={deleteError || 'Tem certeza que deseja excluir esta demanda? Essa ação não pode ser desfeita.'}
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
      />
    </div>
  );
}
