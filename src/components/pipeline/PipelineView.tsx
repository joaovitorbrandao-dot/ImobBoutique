import { useEffect, useState } from 'react';
import { Plus, Columns4 } from 'lucide-react';
import { Deal, PipelineStage, Institution } from '../../types';
import { fetchDeals, fetchPipelineStages, fetchInstitutions, createDeal, reorderDeals } from '../../lib/supabase';
import BoardView from './BoardView';
import AddDealModal from './AddDealModal';
import DealDetailPanel from './DealDetailPanel';
import EmptyState from '../shared/EmptyState';

export default function PipelineView() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [stagesData, dealsData, institutionsData] = await Promise.all([
        fetchPipelineStages(),
        fetchDeals(),
        fetchInstitutions(),
      ]);
      setStages(stagesData);
      setDeals(dealsData);
      setInstitutions(institutionsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateDeal = async (payload: {
    institutionId: string; demandId: string; contactId: string | null; stageKey: string;
    value: number; probability: number; expectedCloseDate: string | null; driveLink: string; notes: string;
  }) => {
    await createDeal(payload);
    await load();
  };

  const handlePersistReorder = async (stageKey: string, orderedDealIds: string[], movedDealId: string) => {
    // Optimistic local update so the board doesn't flicker while the request is in flight.
    setDeals((prev) =>
      prev.map((d) => {
        const position = orderedDealIds.indexOf(d.id);
        if (position === -1) return d;
        return { ...d, stageKey, boardPosition: position };
      })
    );
    try {
      await reorderDeals(stageKey, orderedDealIds);
    } catch {
      await load();
    }
  };

  const openDeal = deals.find((d) => d.id === openDealId);

  return (
    <div className="space-y-5 animate-fade-in h-full flex flex-col" id="pipeline-root">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md flex-shrink-0">
        <p className="text-[11px] font-bold text-slate-400 tracking-wide">Arraste os cards para mover entre estágios</p>
        <button
          onClick={() => setIsAddOpen(true)}
          disabled={stages.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Negociação
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button onClick={load} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={Columns4}
          title="Cadastre uma instituição primeiro"
          description="O pipeline de negociação vincula instituições da carteira de clientes — cadastre ao menos uma antes de criar negociações."
        />
      ) : (
        <div className="flex-1 overflow-hidden">
          <BoardView stages={stages} deals={deals} onOpenDeal={(deal) => setOpenDealId(deal.id)} onPersistReorder={handlePersistReorder} />
        </div>
      )}

      <AddDealModal
        isOpen={isAddOpen}
        institutions={institutions}
        defaultStageKey={stages[0]?.key || 'prospeccao'}
        onClose={() => setIsAddOpen(false)}
        onSave={handleCreateDeal}
      />

      {openDeal && (
        <DealDetailPanel
          dealId={openDeal.id}
          institutions={institutions}
          stages={stages}
          onClose={() => setOpenDealId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
