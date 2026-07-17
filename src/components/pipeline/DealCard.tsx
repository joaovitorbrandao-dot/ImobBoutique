import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, User, Home, ExternalLink } from 'lucide-react';
import { Deal } from '../../types';
import { formatCurrencyCompact } from '../../lib/format';

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isOverlay?: boolean;
}

export default function DealCard({ deal, onClick, isOverlay }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-xs hover:border-indigo-200 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2.5 ${
        isOverlay ? 'shadow-lg rotate-2' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-[12.5px] font-bold text-slate-800 leading-snug line-clamp-2">{deal.institutionName || 'Sem instituição'}</p>
      </div>

      {deal.demandSummary && (
        <span className="self-start text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded border border-slate-200 tracking-wider">
          {deal.demandSummary}
        </span>
      )}

      {deal.contactName && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
          <User className="w-3 h-3 text-slate-300 flex-shrink-0" /> {deal.contactName}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-[12px] font-extrabold text-slate-700">{formatCurrencyCompact(deal.value)}</span>
        <div className="flex items-center gap-2">
          {!!deal.assetCount && (
            <span className="flex items-center gap-1 text-[10.5px] font-bold text-slate-400">
              <Home className="w-3 h-3" /> {deal.assetCount}
            </span>
          )}
          {deal.driveLink && <ExternalLink className="w-3 h-3 text-slate-300" />}
        </div>
      </div>
    </div>
  );
}
