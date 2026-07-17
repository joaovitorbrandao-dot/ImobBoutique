import { PipelineStage, DashboardKpis } from '../../types';
import { stageColorClasses } from '../pipeline/constants';
import { formatCurrencyCompact } from '../../lib/format';

interface DealsByStageChartProps {
  stages: PipelineStage[];
  dealsByStage: DashboardKpis['dealsByStage'];
}

export default function DealsByStageChart({ stages, dealsByStage }: DealsByStageChartProps) {
  const maxValue = Math.max(1, ...dealsByStage.map((d) => d.value));

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <h3 className="text-xs font-extrabold text-slate-700 tracking-wide mb-4">Negociações por Estágio</h3>
      <div className="space-y-3">
        {dealsByStage.map((row) => {
          const stage = stages.find((s) => s.key === row.stageKey);
          if (!stage) return null;
          const colors = stageColorClasses(stage.color);
          const widthPct = Math.max(3, (row.value / maxValue) * 100);
          return (
            <div key={row.stageKey} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  {stage.label}
                  <span className="text-slate-400 font-semibold">({row.count})</span>
                </span>
                <span className="text-slate-500">{formatCurrencyCompact(row.value)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
        {dealsByStage.every((d) => d.count === 0) && (
          <p className="text-[11px] text-slate-400 text-center py-4">Nenhuma negociação cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
