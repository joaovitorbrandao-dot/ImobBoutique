import { useEffect, useState } from 'react';
import { Plus, Building2, Pencil, Trash2, ExternalLink, MapPin } from 'lucide-react';
import { Asset, AssetType, AssetStatus, ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '../../types';
import { fetchAssets, createAsset, updateAsset, deleteAsset } from '../../lib/supabase';
import { formatCurrencyCompact, formatArea, formatPercent } from '../../lib/format';
import AssetFormModal from './AssetFormModal';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';

const STATUS_CHIP: Record<AssetStatus, string> = {
  disponivel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  em_negociacao: 'bg-amber-50 text-amber-700 border-amber-200',
  reservado: 'bg-blue-50 text-blue-700 border-blue-200',
  indisponivel: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function AtivosView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Asset | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      setAssets(await fetchAssets({ type: typeFilter || undefined, status: statusFilter || undefined, search: search || undefined }));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar ativos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [typeFilter, statusFilter, search]);

  const handleSave = async (payload: {
    type: AssetType; address: string; areaM2: number | null; price: number | null; capRate: number | null;
    ownerName: string; driveLink: string; status: AssetStatus; notes: string;
  }) => {
    if (editingAsset) await updateAsset(editingAsset.id, payload);
    else await createAsset(payload);
    await load();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError('');
    try {
      await deleteAsset(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir ativo.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" id="ativos-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-md flex-wrap">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar por endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs bg-slate-100 border-0 rounded-lg px-3 py-2 font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 w-56"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
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
            {Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingAsset(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Ativo
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button onClick={load} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum ativo cadastrado"
          description="Cadastre os imóveis disponíveis para vincular às negociações do pipeline."
          action={{ label: 'Novo Ativo', onClick: () => setIsFormOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10.5px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded border border-slate-200 tracking-wider">
                  {ASSET_TYPE_LABELS[asset.type]}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CHIP[asset.status]}`}>
                  {ASSET_STATUS_LABELS[asset.status]}
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-slate-800 leading-snug">{asset.address}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-lg p-2">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-700">{formatArea(asset.areaM2)}</p>
                  <p className="text-[9.5px] text-slate-400 font-bold">Área</p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-700">{formatCurrencyCompact(asset.price)}</p>
                  <p className="text-[9.5px] text-slate-400 font-bold">Preço</p>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-slate-700">{formatPercent(asset.capRate)}</p>
                  <p className="text-[9.5px] text-slate-400 font-bold">Cap Rate</p>
                </div>
              </div>

              {asset.ownerName && <p className="text-[11px] text-slate-400 font-medium">Proprietário: {asset.ownerName}</p>}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                {asset.driveLink ? (
                  <a
                    href={asset.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Drive
                  </a>
                ) : <span />}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingAsset(asset);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => setPendingDelete(asset)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AssetFormModal isOpen={isFormOpen} asset={editingAsset} onClose={() => setIsFormOpen(false)} onSave={handleSave} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Excluir ativo?"
        message={deleteError || 'Tem certeza que deseja excluir este ativo? Essa ação não pode ser desfeita.'}
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
      />
    </div>
  );
}
