import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../api/client';
import { useStore } from '../store/useStore';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const location = useLocation();
  const initialInvite = new URLSearchParams(location.search).get('invite') || '';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigoConvite, setCodigoConvite] = useState(initialInvite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newUser = await registerUser({ nome, email, senha, codigo_convite: codigoConvite || undefined });
      const authData = await loginUser({ email, senha });
      setAuth(authData.access_token, newUser);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Criar conta"
      title="Comece a organizar sua casa"
      description="Crie uma nova casa ou use um código de convite para entrar em uma já existente."
      footer={<>Já tem uma conta? <Link to="/login" className="text-action font-semibold">Entrar</Link></>}
    >
      <form className="space-y-4" onSubmit={handleRegister}>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
        <div>
          <label htmlFor="nome" className="mb-2 block text-sm font-semibold">Seu nome</label>
          <input id="nome" name="nome" type="text" required autoComplete="name" value={nome} onChange={event => setNome(event.target.value)} className="form-input" placeholder="Como podemos chamar você?" />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} className="form-input" placeholder="nome@exemplo.com" />
        </div>
        <div>
          <label htmlFor="senha" className="mb-2 block text-sm font-semibold">Senha</label>
          <input id="senha" name="senha" type="password" required minLength={6} autoComplete="new-password" value={senha} onChange={event => setSenha(event.target.value)} className="form-input" placeholder="Mínimo de 6 caracteres…" />
        </div>
        <div>
          <label htmlFor="codigo" className="mb-2 block text-sm font-semibold">Código de convite <span className="font-normal text-[var(--color-aurora-text-muted)]">(opcional)</span></label>
          <input id="codigo" name="codigo_convite" type="text" autoComplete="off" spellCheck={false} value={codigoConvite} onChange={event => setCodigoConvite(event.target.value)} className={`form-input font-mono uppercase tracking-widest ${initialInvite ? '!border-emerald-300 !bg-emerald-50 !text-emerald-800' : ''}`} placeholder="Ex.: AB92KX" maxLength={6} readOnly={Boolean(initialInvite)} />
          {initialInvite && <p className="mt-1.5 text-xs font-medium text-emerald-600">Convite aplicado pelo link.</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary group mt-2 flex w-full items-center justify-center px-4 py-3.5">
          {loading ? <><Loader2 aria-hidden="true" className="mr-2 animate-spin" size={20} />Criando conta…</> : <>Criar conta <ArrowRight aria-hidden="true" size={17} className="ml-2 transition-transform group-hover:translate-x-1" /></>}
        </button>
      </form>
    </AuthLayout>
  );
}
