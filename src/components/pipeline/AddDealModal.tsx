import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import SearchableSelect from '../shared/SearchableSelect';
import { Institution, Demand, InstitutionContact, ASSET_TYPE_LABELS } from '../../types';
import { fetchDemands, fetchContacts } from '../../lib/supabase';

interface AddDealModalProps {
  isOpen: boolean;
  institutions: Institution[];
  defaultStageKey: string;
  onClose: () => void;
  onSave: (payload: {
    institutionId: string; demandId: string; contactId: string | null; stageKey: string;
    value: number; probability: number; expectedCloseDate: string | null; driveLink: string; notes: string;
  }) => Promise<void>;
}

export default function AddDealModal({ isOpen, institutions, defaultStageKey, onClose, onSave }: AddDealModalProps) {
  const [institutionId, setInstitutionId] = useState('');
  const [demandId, setDemandId] = useState('');
  const [contactId, setContactId] = useState('');
  const [demands, setDemands] = useState<Demand[]>([]);
  const [contacts, setContacts] = useState<InstitutionContact[]>([]);
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('50');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInstitutionId('');
      setDemandId('');
      setContactId('');
      setDemands([]);
      setContacts([]);
      setValue('');
      setProbability('50');
      setExpectedCloseDate('');
      setDriveLink('');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!institutionId) {
      setDemands([]);
      setContacts([]);
      setDemandId('');
      setContactId('');
      return;
    }
    fetchDemands({ institution_id: institutionId }).then(setDemands).catch(() => setDemands([]));
    fetchContacts(institutionId).then(setContacts).catch(() => setContacts([]));
    setDemandId('');
    setContactId('');
  }, [institutionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!institutionId || !demandId) {
      setError('Selecione a instituição e a demanda.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave({
        institutionId,
        demandId,
        contactId: contactId || null,
        stageKey: defaultStageKey,
        value: value ? Number(value) : 0,
        probability: Number(probability),
        expectedCloseDate: expectedCloseDate || null,
        driveLink,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar negociação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Negociação">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Instituição</label>
          <SearchableSelect
            options={institutions.map((i) => ({ value: i.id, label: i.name, sublabel: i.segment }))}
            value={institutionId || null}
            onChange={setInstitutionId}
            placeholder="Selecionar instituição..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Demanda</label>
          <SearchableSelect
            options={demands.map((d) => ({ value: d.id, label: ASSET_TYPE_LABELS[d.assetType], sublabel: d.region }))}
            value={demandId || null}
            onChange={setDemandId}
            placeholder={institutionId ? 'Selecionar demanda...' : 'Selecione uma instituição primeiro'}
            disabled={!institutionId}
            emptyMessage="Essa instituição não tem demandas cadastradas"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Pessoa de Contato</label>
          <SearchableSelect
            options={contacts.map((c) => ({ value: c.id, label: c.name, sublabel: c.roleTitle }))}
            value={contactId || null}
            onChange={setContactId}
            placeholder={institutionId ? 'Selecionar contato (opcional)...' : 'Selecione uma instituição primeiro'}
            disabled={!institutionId}
            emptyMessage="Essa instituição não tem contatos cadastrados"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Valor Estimado (R$)</label>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Probabilidade (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Previsão de Fechamento</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Link do Drive</label>
            <input
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 resize-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors">
            {isSaving ? 'Criando...' : 'Criar Negociação'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
