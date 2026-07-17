import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil, Trash2, Plus, Star, Mail, Phone, ClipboardList, Columns4 } from 'lucide-react';
import { Institution, InstitutionContact } from '../../types';
import { fetchContacts, createContact, updateContact, deleteContact } from '../../lib/supabase';
import ContactFormModal from './ContactFormModal';
import ConfirmDialog from '../shared/ConfirmDialog';

interface InstitutionDetailPanelProps {
  institution: Institution | null;
  onClose: () => void;
  onEdit: (institution: Institution) => void;
  onDelete: (institution: Institution) => void;
  onContactsChanged: () => void;
}

export default function InstitutionDetailPanel({ institution, onClose, onEdit, onDelete, onContactsChanged }: InstitutionDetailPanelProps) {
  const [contacts, setContacts] = useState<InstitutionContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<InstitutionContact | null>(null);
  const [contactPendingDelete, setContactPendingDelete] = useState<InstitutionContact | null>(null);

  const loadContacts = async (institutionId: string) => {
    setIsLoadingContacts(true);
    try {
      setContacts(await fetchContacts(institutionId));
    } catch {
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (institution) loadContacts(institution.id);
  }, [institution?.id]);

  if (!institution) return null;

  const handleSaveContact = async (payload: { name: string; roleTitle: string; email: string; phone: string; isPrimary: boolean; notes: string }) => {
    if (editingContact) await updateContact(institution.id, editingContact.id, payload);
    else await createContact(institution.id, payload);
    await loadContacts(institution.id);
    onContactsChanged();
  };

  const handleDeleteContact = async () => {
    if (!contactPendingDelete) return;
    await deleteContact(institution.id, contactPendingDelete.id);
    setContactPendingDelete(null);
    await loadContacts(institution.id);
    onContactsChanged();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 flex justify-end" onClick={onClose}>
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between z-10">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-wide">{institution.name}</h2>
              {institution.segment && <p className="text-[11px] text-slate-400 font-bold mt-0.5">{institution.segment}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(institution)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => onDelete(institution)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{institution.demandCount ?? 0}</p>
                  <p className="text-[10.5px] text-slate-400 font-bold">Demandas</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5">
                <Columns4 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{institution.dealCount ?? 0}</p>
                  <p className="text-[10.5px] text-slate-400 font-bold">Negociações</p>
                </div>
              </div>
            </div>

            {institution.notes && (
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 tracking-wider mb-1.5">Notas</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{institution.notes}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-slate-400 tracking-wider">Contatos</h3>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setIsContactModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {isLoadingContacts ? (
                <p className="text-[11px] text-slate-400 text-center py-4">Carregando...</p>
              ) : contacts.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4 bg-slate-50 rounded-lg">Nenhum contato cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {contact.isPrimary && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          <span className="text-xs font-bold text-slate-800">{contact.name}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingContact(contact);
                              setIsContactModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-slate-400" />
                          </button>
                          <button onClick={() => setContactPendingDelete(contact)} className="p-1 hover:bg-red-50 rounded cursor-pointer">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                      {contact.roleTitle && <p className="text-[10.5px] text-slate-400 font-semibold">{contact.roleTitle}</p>}
                      <div className="flex flex-col gap-0.5">
                        {contact.email && (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ContactFormModal isOpen={isContactModalOpen} contact={editingContact} onClose={() => setIsContactModalOpen(false)} onSave={handleSaveContact} />

      <ConfirmDialog
        isOpen={!!contactPendingDelete}
        title="Excluir contato?"
        message={`Tem certeza que deseja excluir "${contactPendingDelete?.name}"? Essa ação não pode ser desfeita.`}
        onConfirm={handleDeleteContact}
        onCancel={() => setContactPendingDelete(null)}
      />
    </AnimatePresence>
  );
}
