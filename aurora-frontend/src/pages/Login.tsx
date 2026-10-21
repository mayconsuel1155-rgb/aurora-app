import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { getApiErrorMessage, loginUser } from '../api/client';
import { useStore } from '../store/useStore';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);
  const [sessionMessage, setSessionMessage] = useState(() => {
    const sessionExpired = sessionStorage.getItem('aurora-session-expired') === 'true';
    if (sessionExpired) {
      sessionStorage.removeItem('aurora-session-expired');
      return 'Sua sessão expirou. Entre novamente para continuar.';
    }
    return '';
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSessionMessage('');
    try {
      const data = await loginUser({ email, senha });
      setAuth(data.access_token, data.user || { id: 1, email, nome: 'Morador' });
      navigate('/');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Não foi possível entrar. Confira seus dados.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Entrar"
      title="Bem-vindo de volta"
      description="Acesse sua conta para acompanhar a rotina da casa."
      footer={<>Ainda não tem uma conta? <Link to="/register" className="text-action font-semibold">Criar conta</Link></>}
    >
      <form className="space-y-5" onSubmit={handleLogin}>
        {sessionMessage && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">{sessionMessage}</div>}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} className="form-input" placeholder="nome@exemplo.com" />
        </div>
        <div>
          <label htmlFor="senha" className="mb-2 block text-sm font-semibold">Senha</label>
          <div className="relative">
            <input id="senha" name="senha" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} className="form-input pr-12" placeholder="Digite sua senha…" />
            <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="icon-button absolute right-1 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary group flex w-full items-center justify-center px-4 py-3.5">
          {loading ? <><Loader2 aria-hidden="true" className="mr-2 animate-spin" size={20} />Entrando…</> : <>Entrar no Aurora <ArrowRight aria-hidden="true" size={17} className="ml-2 transition-transform group-hover:translate-x-1" /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
