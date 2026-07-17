import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import { InstitutionContact } from '../../types';

interface ContactFormModalProps {
  isOpen: boolean;
  contact: InstitutionContact | null;
  onClose: () => void;
  onSave: (payload: { name: string; roleTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }) => Promise<void>;
}

const emptyForm = { name: '', roleTitle: '', email: '', phone: '', isPrimary: false, notes: '' };

export default function ContactFormModal({ isOpen, contact, onClose, onSave }: ContactFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(
        contact
          ? { name: contact.name, roleTitle: contact.roleTitle, email: contact.email, phone: contact.phone, isPrimary: contact.isPrimary, notes: contact.notes }
          : emptyForm
      );
      setError('');
    }
  }, [isOpen, contact]);

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
      setError(err.message || 'Erro ao salvar contato.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contact ? 'Editar Contato' : 'Novo Contato'} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Nome</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Cargo</label>
          <input
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
            placeholder="Ex: Diretor de Investimentos"
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Telefone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <label className="flex items-center gap-2.5 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
          />
          <span className="text-xs font-bold text-indigo-900">Contato principal</span>
        </label>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
