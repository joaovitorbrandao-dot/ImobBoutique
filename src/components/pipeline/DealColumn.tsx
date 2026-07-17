import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Layers } from 'lucide-react';
import { Deal, PipelineStage } from '../../types';
import { stageColorClasses } from './constants';
import { formatCurrencyCompact } from '../../lib/format';
import DealCard from './DealCard';

interface DealColumnProps {
  stage: PipelineStage;
  dealIds: string[];
  dealsById: Record<string, Deal>;
  totalValue: number;
  onOpenDeal: (deal: Deal) => void;
}

export default function DealColumn({ stage, dealIds, dealsById, totalValue, onOpenDeal }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const colors = stageColorClasses(stage.color);

  return (
    <div className="rounded-xl border border-slate-200/70 min-w-[260px] flex flex-col overflow-hidden bg-white flex-shrink-0">
      <div className="flex flex-col gap-1 px-3.5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 tracking-wider flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
            {stage.label}
          </span>
          <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{dealIds.length}</span>
        </div>
        {totalValue > 0 && <span className="text-[10.5px] text-slate-400 font-bold">{formatCurrencyCompact(totalValue)}</span>}
      </div>

      <div ref={setNodeRef} className={`space-y-2.5 p-2.5 flex-1 min-h-[120px] transition-colors ${isOver ? 'bg-indigo-50/40' : ''}`}>
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          {dealIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-10">
              <Layers className="w-6 h-6 text-slate-300" />
              <span className="text-[10.5px] text-slate-400 font-bold mt-2">Nenhuma negociação</span>
            </div>
          ) : (
            dealIds.map((id) => {
              const deal = dealsById[id];
              if (!deal) return null;
              return <DealCard key={id} deal={deal} onClick={() => onOpenDeal(deal)} />;
            })
          )}
        </SortableContext>
      </div>
    </div>
  );
}
