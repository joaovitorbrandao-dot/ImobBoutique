import { useEffect, useState } from 'react';
import { Search, Plus, X, MapPin } from 'lucide-react';
import Modal from '../shared/Modal';
import { Asset, ASSET_TYPE_LABELS } from '../../types';
import { fetchAssets, attachAssetToDeal, detachAssetFromDeal } from '../../lib/supabase';
import { formatCurrencyCompact } from '../../lib/format';

interface AssetPickerModalProps {
  isOpen: boolean;
  dealId: string;
  attachedAssets: Asset[];
  onClose: () => void;
  onChanged: () => void;
}

export default function AssetPickerModal({ isOpen, dealId, attachedAssets, onClose, onChanged }: AssetPickerModalProps) {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetchAssets(search ? { search } : undefined)
      .then(setAllAssets)
      .finally(() => setIsLoading(false));
  }, [isOpen, search]);

  const attachedIds = new Set(attachedAssets.map((a) => a.id));

  const handleToggle = async (asset: Asset) => {
    setPendingId(asset.id);
    try {
      if (attachedIds.has(asset.id)) await detachAssetFromDeal(dealId, asset.id);
      else await attachAssetToDeal(dealId, asset.id);
      onChanged();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ativos Vinculados" maxWidth="max-w-lg">
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por endereço..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <p className="text-[11px] text-slate-400 text-center py-6">Carregando...</p>
          ) : allAssets.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center py-6">Nenhum ativo encontrado.</p>
          ) : (
            allAssets.map((asset) => {
              const isAttached = attachedIds.has(asset.id);
              return (
                <div key={asset.id} className="flex items-center justify-between gap-3 p-2.5 border border-slate-100 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded border border-slate-200">
                        {ASSET_TYPE_LABELS[asset.type]}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-bold">{formatCurrencyCompact(asset.price)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-300 flex-shrink-0" />
                      <p className="text-xs font-semibold text-slate-700 truncate">{asset.address}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={pendingId === asset.id}
                    onClick={() => handleToggle(asset)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer flex-shrink-0 disabled:opacity-60 ${
                      isAttached ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isAttached ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isAttached ? 'Remover' : 'Adicionar'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} type="button" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
