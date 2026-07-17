import { useEffect, useState } from 'react';
import { Calendar, Video, ExternalLink, Building2, RefreshCw } from 'lucide-react';
import { fetchUpcomingEvents } from '../../lib/supabase';
import { DealCalendarEvent, ASSET_TYPE_LABELS, AssetType } from '../../types';
import { formatDateTime } from '../../lib/format';
import EmptyState from '../shared/EmptyState';

type UpcomingEvent = DealCalendarEvent & { dealInstitution?: string; dealAssetType?: string };

export default function AgendaView() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      setEvents(await fetchUpcomingEvents());
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar compromissos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5 animate-fade-in" id="agenda-root">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-md">
        <p className="text-[11px] font-bold text-slate-400 tracking-wide">
          Compromissos criados a partir de negociações do pipeline. Agende reuniões diretamente no card de uma negociação.
        </p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 tracking-wider py-16 text-center">Carregando...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-red-600">{error}</p>
          <button onClick={load} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum compromisso agendado"
          description="Abra uma negociação no Pipeline e use 'Agendar Reunião' para criar um compromisso na sua Google Agenda vinculado ao card."
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-md divide-y divide-slate-50">
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{evt.titleSnapshot || '(sem título)'}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-[10.5px] text-slate-400 font-bold">{formatDateTime(evt.startSnapshot)}</span>
                  {evt.dealInstitution && (
                    <span className="flex items-center gap-1 text-[10.5px] text-slate-400 font-semibold">
                      <Building2 className="w-3 h-3" /> {evt.dealInstitution}
                    </span>
                  )}
                  {evt.dealAssetType && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded border border-slate-200">
                      {ASSET_TYPE_LABELS[evt.dealAssetType as AssetType] || evt.dealAssetType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {evt.hangoutLink && (
                  <a href={evt.hangoutLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg" title="Entrar no Meet">
                    <Video className="w-4 h-4 text-indigo-500" />
                  </a>
                )}
                {evt.htmlLink && (
                  <a href={evt.htmlLink} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-lg" title="Abrir no Google Agenda">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
