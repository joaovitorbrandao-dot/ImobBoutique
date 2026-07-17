import { useEffect, useState } from 'react';
import { Plus, Search, Users, ClipboardList, Columns4 } from 'lucide-react';
import { Institution, INSTITUTION_TYPE_LABELS } from '../../types';
import { fetchInstitutions, deleteInstitution } from '../../lib/supabase';
import InstitutionFormModal from './InstitutionFormModal';
import InstitutionDetailPanel from './InstitutionDetailPanel';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';

export default function CarteiraView() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Institution | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async (searchTerm?: string): Promise<Institution[]> => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchInstitutions(searchTerm ? { search: searchTerm } : undefined);
      setInstitutions(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar carteira de clientes.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSaved = async () => {
    const editingId = editingInstitution?.id;
    const data = await load(search);
    if (editingId && selectedInstitution?.id === editingId) {
      setSelectedInstitution(data.find((i) => i.id === editingId) || null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError('');
    try {
      await deleteInstitution(pendingDelete.id);
      setPendingDelete(null);
      setSelectedInstitution(null);
      await load(search);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir instituição.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in" id="carteira-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar instituição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 border-0 rounded-full pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder-slate-400 font-semibold"
          />
        </div>
        <button
          onClick={() => {
            setEditingInstitution(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Instituição
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button onClick={() => load(search)} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhuma instituição cadastrada"
          description="Cadastre a primeira instituição da sua carteira de clientes institucionais."
          action={{ label: 'Nova Instituição', onClick: () => setIsFormOpen(true) }}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="px-5 py-3 text-[10.5px] font-bold text-slate-400 tracking-wider">Instituição</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-slate-400 tracking-wider">Tipo</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-slate-400 tracking-wider text-center">Contatos</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-slate-400 tracking-wider text-center">Demandas</th>
                <th className="px-5 py-3 text-[10.5px] font-bold text-slate-400 tracking-wider text-center">Negociações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {institutions.map((inst) => (
                <tr
                  key={inst.id}
                  onClick={() => setSelectedInstitution(inst)}
                  className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{inst.name}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{inst.type ? INSTITUTION_TYPE_LABELS[inst.type] : '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold text-center flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-300" /> {inst.contactCount ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold text-center">
                    <span className="inline-flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5 text-slate-300" /> {inst.demandCount ?? 0}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold text-center">
                    <span className="inline-flex items-center gap-1"><Columns4 className="w-3.5 h-3.5 text-slate-300" /> {inst.dealCount ?? 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InstitutionFormModal
        isOpen={isFormOpen}
        institution={editingInstitution}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
      />

      {selectedInstitution && (
        <InstitutionDetailPanel
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onEdit={(inst) => {
            setEditingInstitution(inst);
            setIsFormOpen(true);
          }}
          onDelete={(inst) => setPendingDelete(inst)}
          onContactsChanged={() => load(search)}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Excluir instituição?"
        message={deleteError || `Tem certeza que deseja excluir "${pendingDelete?.name}"? Essa ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
      />
    </div>
  );
}
