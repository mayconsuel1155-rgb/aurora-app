import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/client';
import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await loginUser({ email, senha });
      
      // Decodificar JWT basico manual para pegar id caso queira, 
      // Mas o ideal era retornar o user junto.
      // O backend /login por enquanto só retorna o token. 
      // Vamos assumir que a store só precisa do token agora, 
      // ou podemos fazer uma request extra para /me se existir (não criamos ainda).
      // Mas vamos salvar um usuario basico e o token.
      setAuth(data.access_token, { id: 1, email, nome: "Morador" }); 
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-aurora-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-aurora-primary)]/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-[var(--color-aurora-primary)] to-purple-400 rounded-3xl flex items-center justify-center shadow-lg shadow-[var(--color-aurora-primary)]/30">
            <Sparkles className="text-white" size={28} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-[var(--color-aurora-text)] tracking-tight">
          Bem-vindo de volta
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-aurora-text-muted)]">
          Ou{' '}
          <Link to="/register" className="font-medium text-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary-hover)] transition-colors">
            crie sua Casa Digital agora
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="aurora-card p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}
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
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-[var(--color-aurora-primary)]/20 text-sm font-medium text-white bg-[var(--color-aurora-primary)] hover:bg-[var(--color-aurora-primary-hover)] transition-all active:scale-[0.98] disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Entrar no Aurora
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
