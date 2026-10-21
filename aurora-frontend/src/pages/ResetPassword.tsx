import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { getApiErrorMessage, resetPassword } from '../api/client';


export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get('token') || '');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) window.history.replaceState({}, '', '/redefinir-senha');
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (senha !== confirmacao) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      setMessage(await resetPassword(token, senha));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Não foi possível redefinir sua senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Nova senha"
      title="Redefina sua senha"
      description="Crie uma nova senha com pelo menos 8 caracteres."
      footer={<>Lembrou sua senha? <Link to="/login" className="text-action font-semibold">Entrar</Link></>}
    >
      {message ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2 aria-hidden="true" className="mb-3" size={28} />
          <p className="font-semibold">Senha atualizada</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
          <Link to="/login" className="mt-4 inline-block font-semibold underline underline-offset-4">Entrar no Aurora</Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!token && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">Este link não contém um token válido. Solicite uma nova recuperação.</div>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
          <div>
            <label htmlFor="nova-senha" className="mb-2 block text-sm font-semibold">Nova senha</label>
            <div className="relative">
              <input id="nova-senha" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={event => setSenha(event.target.value)} className="form-input pr-12" placeholder="Mínimo de 8 caracteres" />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="icon-button absolute right-1 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmar-senha" className="mb-2 block text-sm font-semibold">Confirmar nova senha</label>
            <input id="confirmar-senha" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={72} autoComplete="new-password" value={confirmacao} onChange={event => setConfirmacao(event.target.value)} className="form-input" placeholder="Repita a nova senha" />
          </div>
          <button type="submit" disabled={loading || !token} className="btn-primary flex w-full items-center justify-center px-4 py-3.5">
            {loading ? <><Loader2 aria-hidden="true" className="mr-2 animate-spin" size={20} />Atualizando…</> : 'Salvar nova senha'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
