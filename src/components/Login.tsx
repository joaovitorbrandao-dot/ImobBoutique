import { useState, FormEvent } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { login } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: { id?: string; email?: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Não foi possível autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden" id="login-screen">
      <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_15%,rgba(15,118,110,0.08),transparent_55%),radial-gradient(700px_circle_at_85%_85%,rgba(15,118,110,0.06),transparent_50%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-600/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800 tracking-wide">ImobBoutique</h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-wider mt-0.5">Gestão de Ativos Imobiliários Corporativos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">E-mail</label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
            {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <p className="text-[10.5px] text-slate-400 text-center leading-relaxed">
          Acesso restrito à equipe. Contas são criadas diretamente no painel do Supabase.
        </p>
      </motion.div>
    </div>
  );
}
