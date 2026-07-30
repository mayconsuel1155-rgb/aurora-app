import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { registerUser, loginUser } from '../api/client';
import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialInvite = searchParams.get('invite') || '';
  
  const [codigoConvite, setCodigoConvite] = useState(initialInvite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Cadastra
      const newUser = await registerUser({ nome, email, senha, codigo_convite: codigoConvite || undefined });
      // 2. Faz login automatico
      const authData = await loginUser({ email, senha });
      
      setAuth(authData.access_token, newUser); 
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-aurora-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-aurora-primary)]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-[var(--color-aurora-primary)] to-indigo-400 rounded-3xl flex items-center justify-center shadow-lg shadow-[var(--color-aurora-primary)]/30">
            <Sparkles className="text-white" size={28} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-[var(--color-aurora-text)] tracking-tight">
          Crie sua Casa Digital
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-aurora-text-muted)]">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-medium text-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary-hover)] transition-colors">
            Faça login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="aurora-card p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Seu Nome
              </label>
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all bg-slate-50 dark:bg-slate-900/50/50"
                placeholder="Ex: João da Silva"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Endereço de Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all bg-slate-50 dark:bg-slate-900/50/50"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all bg-slate-50 dark:bg-slate-900/50/50"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código de Convite <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                id="codigo"
                type="text"
                value={codigoConvite}
                onChange={(e) => setCodigoConvite(e.target.value)}
                className={`w-full border rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all uppercase font-mono ${initialInvite ? 'border-green-300 bg-green-50/50 text-green-800' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/50/50'}`}
                placeholder="Ex: AB92KX"
                maxLength={6}
                readOnly={!!initialInvite}
              />
              {initialInvite && (
                <p className="text-xs text-green-600 mt-1 font-medium">✨ Convite aplicado via link!</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-[var(--color-aurora-primary)]/20 text-sm font-medium text-white bg-[var(--color-aurora-primary)] hover:bg-[var(--color-aurora-primary-hover)] transition-all active:scale-[0.98] disabled:opacity-70 group mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Começar a usar
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
