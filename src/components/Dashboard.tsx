import { useEffect, useState } from 'react';
import { TrendingUp, Scale, ClipboardList, Building2, Target, Wallet, RefreshCw } from 'lucide-react';
import KpiCard from './dashboard/KpiCard';
import DealsByStageChart from './dashboard/DealsByStageChart';
import { fetchDashboardKpis, fetchPipelineStages } from '../lib/supabase';
import { DashboardKpis, PipelineStage } from '../types';
import { formatCurrencyCompact, formatPercent } from '../lib/format';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [kpisData, stagesData] = await Promise.all([fetchDashboardKpis(), fetchPipelineStages()]);
      setKpis(kpisData);
      setStages(stagesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar indicadores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    return <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando indicadores...</div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
        <p className="text-xs font-semibold text-red-600">{error}</p>
        <button onClick={load} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
      </div>
    );
  }

  if (!kpis) return null;

  const conversionRate = kpis.dealsClosed > 0 ? (kpis.dealsWon / kpis.dealsClosed) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-root">
      <div className="flex justify-end">
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={Wallet} label="Pipeline Aberto" value={formatCurrencyCompact(kpis.openPipelineValue)} accent="indigo" />
        <KpiCard icon={Scale} label="Pipeline Ponderado" value={formatCurrencyCompact(kpis.weightedPipelineValue)} accent="blue" sublabel="por probabilidade" />
        <KpiCard icon={ClipboardList} label="Demandas Ativas" value={String(kpis.activeDemands)} accent="amber" onClick={() => onNavigate('demandas')} />
        <KpiCard icon={Building2} label="Ativos Cadastrados" value={String(kpis.registeredAssets)} accent="slate" onClick={() => onNavigate('ativos')} />
        <KpiCard icon={Target} label="Taxa de Conversão" value={formatPercent(Math.round(conversionRate))} accent="emerald" sublabel={`${kpis.dealsWon} de ${kpis.dealsClosed} fechadas`} />
        <KpiCard icon={TrendingUp} label="Ticket Médio" value={formatCurrencyCompact(kpis.averageTicket)} accent="rose" sublabel="negociações ganhas" />
      </div>

      <DealsByStageChart stages={stages} dealsByStage={kpis.dealsByStage} />
    </div>
  );
}
