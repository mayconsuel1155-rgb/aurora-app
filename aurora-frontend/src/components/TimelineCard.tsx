import { Calendar, Clock, Video, ArrowRight, ExternalLink } from 'lucide-react';
import type { Evento } from '../api/client';
import { Link } from 'react-router-dom';

interface TimelineCardProps {
  eventos: Evento[];
}

export default function TimelineCard({ eventos }: TimelineCardProps) {
  // Filtrar apenas eventos válidos
  const safeEventos = Array.isArray(eventos) ? eventos : [];

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    
    // Se o evento não tiver tempo (só YYYY-MM-DD), o timezone pode afetar.
    // Para simplificar no MVP, usaremos o formato local.
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    
    const isHoje = data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth();
    const isAmanha = data.getDate() === amanha.getDate() && data.getMonth() === amanha.getMonth();
    
    // Se for data completa com hora (tem "T")
    if (dataStr.includes('T')) {
      const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (isHoje) return `Hoje às ${hora}`;
      if (isAmanha) return `Amanhã às ${hora}`;
      
      const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `${dia} às ${hora}`;
    }
    
    // Evento de dia inteiro
    if (isHoje) return 'Hoje (Dia todo)';
    if (isAmanha) return 'Amanhã (Dia todo)';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="aurora-card p-6 md:p-8 flex flex-col justify-between transition-smooth hover:translate-y-[-2px] hover:shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="p-4 rounded-3xl bg-blue-50 text-blue-600 backdrop-blur-md">
            <Calendar size={32} strokeWidth={1.5} />
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Timeline
          </span>
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-semibold">Próximos Compromissos</h2>
          <p className="text-[var(--color-aurora-text-muted)] text-sm">
            {safeEventos.length > 0 
              ? `Você tem ${safeEventos.length} eventos chegando.`
              : 'Nenhum compromisso agendado para os próximos dias.'}
          </p>
        </div>

        {safeEventos.length > 0 ? (
          <div className="space-y-4 mb-6">
            {safeEventos.slice(0, 4).map((evento) => (
              <div key={evento.id} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-100 dark:border-slate-700">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{evento.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatarData(evento.data)}
                    </span>
                    {evento.link_meet && (
                      <a href={evento.link_meet} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Video size={12} />
                        Meet
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700 border-dashed">
            <Calendar size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Sua agenda está livre!</p>
            <Link to="/integracoes" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Verificar Conexões
            </Link>
          </div>
        )}
      </div>

      <Link to="/integracoes" className="group flex items-center justify-between w-full py-4 px-6 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-blue-50 hover:text-blue-700 transition-smooth font-medium active:scale-95 border border-slate-100 dark:border-slate-700">
        <span className="flex items-center gap-2">
           <ExternalLink size={18} />
           Gerenciar Integrações
        </span>
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
