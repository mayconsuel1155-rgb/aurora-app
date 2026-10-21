import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { getApiErrorMessage, requestPasswordReset } from '../api/client';


export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      setMessage(await requestPasswordReset(email));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Não foi possível solicitar a recuperação agora.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Recuperar acesso"
      title="Esqueceu sua senha?"
      description="Informe seu e-mail e enviaremos um link seguro, válido por 15 minutos."
      footer={<Link to="/login" className="inline-flex items-center gap-2 text-action font-semibold"><ArrowLeft aria-hidden="true" size={15} />Voltar para entrar</Link>}
    >
      {message ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          <MailCheck aria-hidden="true" className="mb-3" size={28} />
          <p className="font-semibold">Confira sua caixa de entrada</p>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail da conta</label>
            <input id="email" name="email" type="email" required autoComplete="email" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} className="form-input" placeholder="nome@exemplo.com" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center px-4 py-3.5">
            {loading ? <><Loader2 aria-hidden="true" className="mr-2 animate-spin" size={20} />Enviando…</> : 'Enviar link de recuperação'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
