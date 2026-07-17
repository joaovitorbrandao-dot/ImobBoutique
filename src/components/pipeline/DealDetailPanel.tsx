import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Home, Plus, Calendar, ExternalLink, Video, Save } from 'lucide-react';
import { Deal, Institution, Demand, InstitutionContact, PipelineStage, ASSET_TYPE_LABELS, INSTITUTION_TYPE_LABELS } from '../../types';
import { fetchDeal, fetchDemands, fetchContacts, updateDeal, deleteDeal, reorderDeals, deleteDealCalendarEvent } from '../../lib/supabase';
import { formatCurrencyCompact, formatDateTime } from '../../lib/format';
import SearchableSelect from '../shared/SearchableSelect';
import ConfirmDialog from '../shared/ConfirmDialog';
import AssetPickerModal from './AssetPickerModal';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import { stageColorClasses } from './constants';

interface DealDetailPanelProps {
  dealId: string;
  institutions: Institution[];
  stages: PipelineStage[];
  onClose: () => void;
  onChanged: () => void;
}

export default function DealDetailPanel({ dealId, institutions, stages, onClose, onChanged }: DealDetailPanelProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [contacts, setContacts] = useState<InstitutionContact[]>([]);

  const [form, setForm] = useState({
    institutionId: '', demandId: '', contactId: '', value: '', probability: '50', expectedCloseDate: '', driveLink: '', notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDeal(dealId);
      setDeal(data);
      setForm({
        institutionId: data.institutionId,
        demandId: data.demandId,
        contactId: data.contactId || '',
        value: String(data.value || 0),
        probability: String(data.probability ?? 50),
        expectedCloseDate: data.expectedCloseDate || '',
        driveLink: data.driveLink,
        notes: data.notes,
      });
      const [demandsData, contactsData] = await Promise.all([
        fetchDemands({ institution_id: data.institutionId }),
        fetchContacts(data.institutionId),
      ]);
      setDemands(demandsData);
      setContacts(contactsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dealId]);

  const handleInstitutionChange = async (institutionId: string) => {
    setForm({ ...form, institutionId, demandId: '', contactId: '' });
    const [demandsData, contactsData] = await Promise.all([
      fetchDemands({ institution_id: institutionId }),
      fetchContacts(institutionId),
    ]);
    setDemands(demandsData);
    setContacts(contactsData);
  };

  const handleSave = async () => {
    if (!deal) return;
    setIsSaving(true);
    setError('');
    try {
      await updateDeal(deal.id, {
        institutionId: form.institutionId,
        demandId: form.demandId,
        contactId: form.contactId || null,
        value: Number(form.value) || 0,
        probability: Number(form.probability) || 0,
        expectedCloseDate: form.expectedCloseDate || null,
        driveLink: form.driveLink,
        notes: form.notes,
      });
      onChanged();
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar negociação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageChange = async (stageKey: string) => {
    if (!deal || stageKey === deal.stageKey) return;
    await reorderDeals(stageKey, [deal.id]);
    onChanged();
    await load();
  };

  const handleDelete = async () => {
    if (!deal) return;
    await deleteDeal(deal.id);
    onChanged();
    onClose();
  };

  const handleRemoveEvent = async (refId: string) => {
    if (!deal) return;
    await deleteDealCalendarEvent(deal.id, refId);
    await load();
  };

  // Asset attach/detach changes the card's asset-count badge on the board,
  // so refresh both this panel's own data and the parent board's deal list.
  const handleAssetsChanged = async () => {
    await load();
    onChanged();
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
          className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between z-10">
            <h2 className="text-sm font-extrabold text-slate-800 tracking-wide">Detalhes da Negociação</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {isLoading || !deal ? (
            <div className="p-8 text-center text-xs text-slate-400">Carregando...</div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap gap-1.5">
                {stages.map((stage) => {
                  const colors = stageColorClasses(stage.color);
                  const isActive = stage.key === deal.stageKey;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => handleStageChange(stage.key)}
                      className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                        isActive ? colors.chip : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {stage.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Instituição</label>
                <SearchableSelect
                  options={institutions.map((i) => ({ value: i.id, label: i.name, sublabel: i.type ? INSTITUTION_TYPE_LABELS[i.type] : undefined }))}
                  value={form.institutionId || null}
                  onChange={handleInstitutionChange}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Demanda</label>
                <SearchableSelect
                  options={demands.map((d) => ({ value: d.id, label: ASSET_TYPE_LABELS[d.assetType], sublabel: d.region }))}
                  value={form.demandId || null}
                  onChange={(v) => setForm({ ...form, demandId: v })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Pessoa de Contato</label>
                <SearchableSelect
                  options={contacts.map((c) => ({ value: c.id, label: c.name, sublabel: c.roleTitle }))}
                  value={form.contactId || null}
                  onChange={(v) => setForm({ ...form, contactId: v })}
                  emptyMessage="Nenhum contato cadastrado para essa instituição"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Probabilidade (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Previsão de Fechamento</label>
                  <input
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Link do Drive</label>
                  <input
                    value={form.driveLink}
                    onChange={(e) => setForm({ ...form, driveLink: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 resize-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={() => setPendingDelete(true)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-wider">Ativos Vinculados</h3>
                  <button onClick={() => setIsAssetPickerOpen(true)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Gerenciar
                  </button>
                </div>
                {!deal.assets || deal.assets.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-lg">Nenhum ativo vinculado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {deal.assets.map((asset) => (
                      <div key={asset.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-xs">
                        <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-700 truncate flex-1">{asset.address}</span>
                        <span className="text-[10.5px] text-slate-400 font-bold flex-shrink-0">{formatCurrencyCompact(asset.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400 tracking-wider">Compromissos</h3>
                  <button onClick={() => setIsScheduleOpen(true)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">
                    <Calendar className="w-3.5 h-3.5" /> Agendar Reunião
                  </button>
                </div>
                {!deal.calendarEvents || deal.calendarEvents.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-lg">Nenhum compromisso agendado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {deal.calendarEvents.map((evt) => (
                      <div key={evt.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{evt.titleSnapshot}</p>
                          <p className="text-[10.5px] text-slate-400 font-bold">{formatDateTime(evt.startSnapshot)}</p>
                        </div>
                        {evt.hangoutLink && (
                          <a href={evt.hangoutLink} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded flex-shrink-0">
                            <Video className="w-3.5 h-3.5 text-indigo-500" />
                          </a>
                        )}
                        {evt.htmlLink && (
                          <a href={evt.htmlLink} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-200 rounded flex-shrink-0">
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        )}
                        <button onClick={() => handleRemoveEvent(evt.id)} className="p-1 hover:bg-red-100 rounded flex-shrink-0 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {deal && (
        <>
          <AssetPickerModal
            isOpen={isAssetPickerOpen}
            dealId={deal.id}
            attachedAssets={deal.assets || []}
            onClose={() => setIsAssetPickerOpen(false)}
            onChanged={handleAssetsChanged}
          />
          <ScheduleMeetingModal
            isOpen={isScheduleOpen}
            deal={deal}
            onClose={() => setIsScheduleOpen(false)}
            onScheduled={load}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={pendingDelete}
        title="Excluir negociação?"
        message="Tem certeza que deseja excluir esta negociação? Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </AnimatePresence>
  );
}
