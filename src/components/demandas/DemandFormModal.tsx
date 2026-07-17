import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import SearchableSelect from '../shared/SearchableSelect';
import { Demand, Institution, AssetType, DemandStatus, ASSET_TYPE_LABELS, DEMAND_STATUS_LABELS, INSTITUTION_TYPE_LABELS } from '../../types';

interface DemandFormModalProps {
  isOpen: boolean;
  demand: Demand | null;
  institutions: Institution[];
  defaultInstitutionId?: string;
  onClose: () => void;
  onSave: (payload: {
    institutionId: string; assetType: AssetType; minAbl: number | null; budgetMin: number | null; budgetMax: number | null; capRate: number | null; region: string; status: DemandStatus; notes: string;
  }) => Promise<void>;
}

const emptyForm = {
  institutionId: '',
  assetType: 'escritorio' as AssetType,
  minAbl: '',
  budgetMin: '',
  budgetMax: '',
  capRate: '',
  region: '',
  status: 'aberta' as DemandStatus,
  notes: '',
};

export default function DemandFormModal({ isOpen, demand, institutions, defaultInstitutionId, onClose, onSave }: DemandFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(
        demand
          ? {
              institutionId: demand.institutionId,
              assetType: demand.assetType,
              minAbl: demand.minAbl?.toString() || '',
              budgetMin: demand.budgetMin?.toString() || '',
              budgetMax: demand.budgetMax?.toString() || '',
              capRate: demand.capRate?.toString() || '',
              region: demand.region,
              status: demand.status,
              notes: demand.notes,
            }
          : { ...emptyForm, institutionId: defaultInstitutionId || '' }
      );
      setError('');
    }
  }, [isOpen, demand, defaultInstitutionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.institutionId) {
      setError('Selecione a instituição.');
      return;
    }
    const budgetMin = form.budgetMin ? Number(form.budgetMin) : null;
    const budgetMax = form.budgetMax ? Number(form.budgetMax) : null;
    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      setError('Orçamento mínimo não pode ser maior que o máximo.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave({
        institutionId: form.institutionId,
        assetType: form.assetType,
        minAbl: form.minAbl ? Number(form.minAbl) : null,
        budgetMin,
        budgetMax,
        capRate: form.capRate ? Number(form.capRate) : null,
        region: form.region,
        status: form.status,
        notes: form.notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar demanda.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={demand ? 'Editar Demanda' : 'Nova Demanda'}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Instituição</label>
          <SearchableSelect
            options={institutions.map((i) => ({ value: i.id, label: i.name, sublabel: i.type ? INSTITUTION_TYPE_LABELS[i.type] : undefined }))}
            value={form.institutionId || null}
            onChange={(v) => setForm({ ...form, institutionId: v })}
            placeholder="Selecionar instituição..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Tipo de Ativo</label>
            <select
              value={form.assetType}
              onChange={(e) => setForm({ ...form, assetType: e.target.value as AssetType })}
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
              onChange={(e) => setForm({ ...form, status: e.target.value as DemandStatus })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(DEMAND_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">ABL Mínimo (m²)</label>
          <input
            type="number"
            min="0"
            value={form.minAbl}
            onChange={(e) => setForm({ ...form, minAbl: e.target.value })}
            placeholder="Área Bruta Locável mínima"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Valor Mínimo (R$)</label>
            <input
              type="number"
              min="0"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Valor Máximo (R$)</label>
            <input
              type="number"
              min="0"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
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

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Região</label>
          <input
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            placeholder="Ex: São Paulo - Zona Sul"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
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
