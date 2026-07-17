import { useEffect, useState, FormEvent } from 'react';
import { Video, Sparkles, MapPin, Clock } from 'lucide-react';
import Modal from '../shared/Modal';
import { Deal } from '../../types';
import { initGoogleAuth, googleSignIn, getGoogleAccessToken } from '../../lib/firebaseAuth';
import { createCalendarEvent } from '../../lib/googleCalendar';
import { createDealCalendarEvent } from '../../lib/supabase';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  deal: Deal;
  onClose: () => void;
  onScheduled: () => void;
}

const toDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ScheduleMeetingModal({ isOpen, deal, onClose, onScheduled }: ScheduleMeetingModalProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateKey(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [addMeet, setAddMeet] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = initGoogleAuth(
      (_user, token) => setAccessToken(token),
      () => setAccessToken(null)
    );
    getGoogleAccessToken().then(setAccessToken);
    setTitle(`Reunião – ${deal.institutionName || 'Cliente'}${deal.demandSummary ? ` (${deal.demandSummary})` : ''}`);
    setDescription(deal.notes || '');
    setError('');
    return () => unsubscribe();
  }, [isOpen, deal]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await googleSignIn();
      if (result) setAccessToken(result.accessToken);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Google.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError('');
    try {
      const event = await createCalendarEvent(accessToken, { title, date, startTime, endTime, location, description, addMeet });
      await createDealCalendarEvent(deal.id, {
        googleEventId: event.id,
        titleSnapshot: event.summary || title,
        startSnapshot: event.start.dateTime || `${date}T${startTime}:00`,
        htmlLink: event.htmlLink || '',
        hangoutLink: event.hangoutLink || '',
      });
      onScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao agendar reunião.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agendar Reunião" maxWidth="max-w-md">
      {!accessToken ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Conecte sua conta Google para criar o compromisso direto na sua Agenda oficial, com link do Meet se quiser.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isConnecting ? 'Conectando...' : 'Conectar com Google'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Título</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Início</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Fim</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider flex items-center gap-1 block">
              <MapPin className="w-3 h-3" /> Local (opcional)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 resize-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 cursor-pointer">
            <input
              type="checkbox"
              checked={addMeet}
              onChange={(e) => setAddMeet(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <Video className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900">Criar link do Google Meet</span>
          </label>

          {error && <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors">
              <Clock className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar na Agenda'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
