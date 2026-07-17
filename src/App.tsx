import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  Columns4,
  Calendar,
  LogOut,
} from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CarteiraView from './components/carteira/CarteiraView';
import DemandasView from './components/demandas/DemandasView';
import AtivosView from './components/ativos/AtivosView';
import PipelineView from './components/pipeline/PipelineView';
import AgendaView from './components/agenda/AgendaView';
import { getStoredToken, clearToken, validateSession } from './lib/supabase';

const NAV_ITEMS = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { tab: 'carteira', label: 'Carteira de Clientes', icon: Users },
  { tab: 'demandas', label: 'Demandas', icon: ClipboardList },
  { tab: 'ativos', label: 'Ativos', icon: Building2 },
  { tab: 'pipeline', label: 'Pipeline', icon: Columns4 },
  { tab: 'agenda', label: 'Agenda', icon: Calendar },
];

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Painel Geral de Indicadores',
  carteira: 'Carteira de Clientes Institucionais',
  demandas: 'Demandas por Ativo',
  ativos: 'Cadastro de Ativos Imobiliários',
  pipeline: 'Pipeline de Negociação',
  agenda: 'Agenda de Compromissos',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id?: string; email?: string } | null>(null);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!getStoredToken()) {
      setIsValidatingSession(false);
      return;
    }
    validateSession().then((isValid) => {
      if (!isValid) clearToken();
      else setCurrentUser({});
      setIsValidatingSession(false);
    });
  }, []);

  const handleLogin = (user: { id?: string; email?: string }) => setCurrentUser(user);

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (isValidatingSession) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs font-bold text-slate-400 tracking-wider">Carregando...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden" id="app-root">
      <aside className="w-60 bg-white flex flex-col justify-between shadow-[0_0_40px_-12px_rgba(15,23,42,0.12)] z-20 flex-shrink-0" id="app-sidebar">
        <div className="overflow-y-auto overflow-x-hidden">
          <div className="flex items-center h-16 border-b border-slate-100 px-4 gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-600/30 flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-[13px] tracking-tight text-slate-800 block truncate">ImobBoutique</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider block -mt-0.5 truncate">Ativos Corporativos</span>
            </div>
          </div>

          <nav className="p-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`w-full flex items-center gap-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-150 cursor-pointer px-2.5 py-2 ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-sm flex items-center justify-center font-extrabold text-[11px] text-white flex-shrink-0">
            {currentUser.email?.slice(0, 2).toUpperCase() || 'IB'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-bold text-slate-700 truncate">{currentUser.email}</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur-sm px-8 flex items-center border-b border-slate-100 z-10 flex-shrink-0" id="app-header">
          <h1 className="text-[13.5px] font-extrabold text-slate-800 tracking-wide truncate">{TAB_TITLES[activeTab]}</h1>
        </header>

        <div className="flex-1 p-8 overflow-y-auto" id="app-workspace-body">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'carteira' && <CarteiraView />}
          {activeTab === 'demandas' && <DemandasView />}
          {activeTab === 'ativos' && <AtivosView />}
          {activeTab === 'pipeline' && <PipelineView />}
          {activeTab === 'agenda' && <AgendaView />}
        </div>
      </main>
    </div>
  );
}
