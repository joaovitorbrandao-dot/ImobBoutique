import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import { Institution } from '../../types';

interface InstitutionFormModalProps {
  isOpen: boolean;
  institution: Institution | null;
  onClose: () => void;
  onSave: (payload: { name: string; segment: string; notes: string }) => Promise<void>;
}

const emptyForm = { name: '', segment: '', notes: '' };

export default function InstitutionFormModal({ isOpen, institution, onClose, onSave }: InstitutionFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(institution ? { name: institution.name, segment: institution.segment, notes: institution.notes } : emptyForm);
      setError('');
    }
  }, [isOpen, institution]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar instituição.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={institution ? 'Editar Instituição' : 'Nova Instituição'}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Nome da Instituição</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Fundo de Pensão XYZ"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Segmento</label>
          <input
            value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}
            placeholder="Ex: Fundo de Pensão, Family Office, Seguradora..."
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
