import { useEffect, useState, FormEvent } from 'react';
import Modal from '../shared/Modal';
import { Institution, InstitutionType, INSTITUTION_TYPE_LABELS } from '../../types';
import { fetchContacts, createInstitution, updateInstitution, createContact, updateContact } from '../../lib/supabase';

interface InstitutionFormModalProps {
  isOpen: boolean;
  institution: Institution | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  type: '' as InstitutionType | '',
  notes: '',
  contactId: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export default function InstitutionFormModal({ isOpen, institution, onClose, onSaved }: InstitutionFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (!institution) {
      setForm(emptyForm);
      return;
    }
    setForm({
      name: institution.name,
      type: institution.type || '',
      notes: institution.notes,
      contactId: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    });
    setIsLoadingContact(true);
    fetchContacts(institution.id)
      .then((contacts) => {
        const primary = contacts.find((c) => c.isPrimary) || contacts[0];
        if (primary) {
          setForm((prev) => ({
            ...prev,
            contactId: primary.id,
            contactName: primary.name,
            contactPhone: primary.phone,
            contactEmail: primary.email,
          }));
        }
      })
      .finally(() => setIsLoadingContact(false));
  }, [isOpen, institution]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nome da instituição é obrigatório.');
      return;
    }
    if (!form.type) {
      setError('Selecione o tipo.');
      return;
    }
    if (!form.contactName.trim()) {
      setError('Nome da pessoa de contato é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const institutionPayload = { name: form.name, type: form.type, notes: form.notes };
      const savedInstitution = institution
        ? await updateInstitution(institution.id, institutionPayload)
        : await createInstitution(institutionPayload);

      const contactPayload = {
        name: form.contactName,
        roleTitle: '',
        email: form.contactEmail,
        phone: form.contactPhone,
        isPrimary: true,
        notes: '',
      };
      if (form.contactId) await updateContact(savedInstitution.id, form.contactId, contactPayload);
      else await createContact(savedInstitution.id, contactPayload);

      onSaved();
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
          <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Tipo</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as InstitutionType })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Selecionar tipo...</option>
            {Object.entries(INSTITUTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider py-2">Pessoa de Contato</p>
          <div className="space-y-1 mb-3">
            <input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="Nome completo"
              disabled={isLoadingContact}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Celular</label>
              <input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="(11) 99999-9999"
                disabled={isLoadingContact}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">E-mail</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                disabled={isLoadingContact}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

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
          <button type="submit" disabled={isSaving || isLoadingContact} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
