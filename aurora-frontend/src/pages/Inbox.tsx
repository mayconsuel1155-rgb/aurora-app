import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Mail, RefreshCw, Plane, Stethoscope, Briefcase, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Inbox() {
  const { inboxEvents, fetchInboxEvents, loadingInbox } = useStore();
  const [analisando, setAnalisando] = useState(false);

  useEffect(() => {
    // Busca inicial rápida (usa dados da store se existirem)
    if (inboxEvents.length === 0) {
      handleAnalisar();
    }
  }, []);

  const handleAnalisar = async () => {
    setAnalisando(true);
    await fetchInboxEvents();
    setAnalisando(false);
  };

  const getIconePorTipo = (tipo: string) => {
    switch (tipo) {
      case 'voo': return <Plane className="text-sky-500" size={24} />;
      case 'consulta': return <Stethoscope className="text-emerald-500" size={24} />;
      case 'reuniao': return <Briefcase className="text-indigo-500" size={24} />;
      case 'reserva': return <Calendar className="text-rose-500" size={24} />;
      case 'geral': return <Mail className="text-slate-500" size={24} />;
      default: return <Mail className="text-slate-500" size={24} />;
    }
  };

  const getCorFundoPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'voo': return 'bg-sky-50 border-sky-100';
      case 'consulta': return 'bg-emerald-50 border-emerald-100';
      case 'reuniao': return 'bg-indigo-50 border-indigo-100';
      case 'reserva': return 'bg-rose-50 border-rose-100';
      case 'geral': return 'bg-slate-50 border-slate-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-aurora-text)] flex items-center">
            <Mail className="mr-3 text-[var(--color-aurora-primary)]" size={32} />
            Aurora Inbox
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)] max-w-xl">
            A Inteligência Artificial analisa seus últimos e-mails buscando por compromissos invisíveis e extrai automaticamente voos, consultas e reservas.
          </p>
        </div>
        
        <button
          onClick={handleAnalisar}
          disabled={loadingInbox || analisando}
          className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group disabled:opacity-50"
        >
          <RefreshCw className={`mr-2 h-4 w-4 text-slate-400 group-hover:text-indigo-500 ${(loadingInbox || analisando) ? 'animate-spin' : ''}`} />
          {analisando ? 'Analisando e-mails...' : 'Vasculhar E-mails'}
        </button>
      </div>

      <div className="aurora-card p-6 shadow-sm border-t-4 border-t-indigo-400">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-aurora-text)]">Eventos Encontrados</h3>
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
            Últimas 24 horas
          </span>
        </div>

        {(loadingInbox || analisando) && inboxEvents.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              <Mail className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500 animate-pulse">Lendo e decodificando e-mails via IA...</p>
          </div>
        ) : inboxEvents.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Nenhum evento novo encontrado.</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              A IA não encontrou consultas, voos ou reservas nos seus últimos e-mails recebidos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inboxEvents.map((evt) => (
              <div key={evt.id} className={`p-5 rounded-2xl border transition-all hover:shadow-md group ${getCorFundoPorTipo(evt.insight.tipo)} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12">
                  {getIconePorTipo(evt.insight.tipo)}
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 mr-3">
                    {getIconePorTipo(evt.insight.tipo)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">{evt.insight.titulo}</h4>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{evt.insight.tipo}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 bg-white/60 p-3 rounded-xl border border-white/40">
                  {evt.insight.data && (
                    <div className="flex items-center text-sm text-slate-700 mb-2">
                      <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {new Date(evt.insight.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace(', ', ' às ')}
                      </span>
                    </div>
                  )}
                  <div className={`text-xs text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-2 ${!evt.insight.data ? 'mt-0' : ''}`}>
                    {evt.insight.detalhes}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-200/50 flex justify-between items-center">
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    De: {evt.email_remetente}
                  </div>
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                    Adicionar
                    <ChevronRight size={14} className="ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
