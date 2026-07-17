import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import { Asset, AssetType, AssetStatus, ASSET_TYPE_LABELS, ASSET_STATUS_LABELS } from '../../types';

interface AssetFormModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSave: (payload: {
    type: AssetType; address: string; areaM2: number | null; price: number | null; capRate: number | null;
    ownerName: string; driveLink: string; status: AssetStatus; notes: string;
  }) => Promise<void>;
}

const emptyForm = {
  type: 'escritorio' as AssetType,
  address: '',
  areaM2: '',
  price: '',
  capRate: '',
  ownerName: '',
  driveLink: '',
  status: 'disponivel' as AssetStatus,
  notes: '',
};

export default function AssetFormModal({ isOpen, asset, onClose, onSave }: AssetFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(
        asset
          ? {
              type: asset.type,
              address: asset.address,
              areaM2: asset.areaM2?.toString() || '',
              price: asset.price?.toString() || '',
              capRate: asset.capRate?.toString() || '',
              ownerName: asset.ownerName,
              driveLink: asset.driveLink,
              status: asset.status,
              notes: asset.notes,
            }
          : emptyForm
      );
      setError('');
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) {
      setError('Endereço é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave({
        type: form.type,
        address: form.address,
        areaM2: form.areaM2 ? Number(form.areaM2) : null,
        price: form.price ? Number(form.price) : null,
        capRate: form.capRate ? Number(form.capRate) : null,
        ownerName: form.ownerName,
        driveLink: form.driveLink,
        status: form.status,
        notes: form.notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ativo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Editar Ativo' : 'Novo Ativo'}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Endereço</label>
          <input
            autoFocus
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Ex: Av. Faria Lima, 1000 - São Paulo/SP"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Área (m²)</label>
            <input
              type="number"
              min="0"
              value={form.areaM2}
              onChange={(e) => setForm({ ...form, areaM2: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Preço (R$)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Cap Rate (%)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.capRate}
              onChange={(e) => setForm({ ...form, capRate: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Proprietário</label>
            <input
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Link do Drive</label>
            <input
              value={form.driveLink}
              onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 resize-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
