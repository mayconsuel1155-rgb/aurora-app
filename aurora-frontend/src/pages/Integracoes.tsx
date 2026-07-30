import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Network, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Integracoes() {
  const { token } = useStore();
  const location = useLocation();
  const [googleStatus, setGoogleStatus] = useState<'not_connected' | 'connected' | 'connecting'>('not_connected');
  const [alertMsg, setAlertMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    // Verificar status na query string (quando volta do callback do backend)
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    
    if (status === 'success') {
      setAlertMsg({ type: 'success', text: 'Conexão com Google estabelecida com sucesso!' });
      // Remover a query da URL sem recarregar
      window.history.replaceState({}, document.title, location.pathname);
    } else if (status === 'session_error' || status === 'provider_error') {
      setAlertMsg({ type: 'error', text: 'Falha ao conectar. Tente novamente.' });
      window.history.replaceState({}, document.title, location.pathname);
    }

    // Buscar status atual das conexões (TODO: endpoint real)
    verificarConexoes();
  }, [location]);

  const verificarConexoes = async () => {
    try {
      // Mock para verificação. Depois você usará const res = await client.get('/connect/status')
      // Para testes locais, podemos apenas checar.
      setGoogleStatus('not_connected');
    } catch (e) {
      console.error(e);
    }
  };

  const conectarGoogle = () => {
    setGoogleStatus('connecting');
    // Redireciona o browser inteiro para o backend FastAPI iniciar o OAuth
    // Precisamos enviar o token na URL para que o backend saiba QUEM é o usuário
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/connect/google/login?token=${token}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-24">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Network className="text-indigo-600" size={32} strokeWidth={1.5} />
          Aurora Connect
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light">
          Conecte a Aurora aos seus serviços para automação da rotina.
        </p>
      </header>

      {alertMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {alertMsg.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <span className="font-medium">{alertMsg.text}</span>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Calendários e Agendas</h2>
        
        {/* Card Google Calendar */}
        <div className="aurora-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-xl hover:translate-y-[-2px]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
              {/* Google G Logo simplificado SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Google Calendar</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Permita que a Aurora leia seus compromissos para planejar a sua semana e enviar lembretes antecipados.
              </p>
            </div>
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            {googleStatus === 'connected' ? (
              <div className="flex items-center justify-center md:justify-end gap-2 text-emerald-600 font-medium px-6 py-3 bg-emerald-50 rounded-xl w-full">
                <CheckCircle2 size={20} />
                Conectado
              </div>
            ) : (
              <button 
                onClick={conectarGoogle}
                disabled={googleStatus === 'connecting'}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {googleStatus === 'connecting' ? <RefreshCw className="animate-spin" size={20} /> : 'Conectar Agora'}
              </button>
            )}
          </div>
        </div>

        {/* Outlook Coming Soon */}
        <div className="aurora-card p-6 flex items-center justify-between gap-6 opacity-60">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
               <span className="font-bold text-slate-400 text-xl">O</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400">Microsoft Outlook</h3>
              <p className="text-sm text-slate-400 mt-1">
                Integração nativa com o calendário do Office 365 e Outlook.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Em Breve
            </span>
          </div>
        </div>

      </section>
    </div>
  );
}
