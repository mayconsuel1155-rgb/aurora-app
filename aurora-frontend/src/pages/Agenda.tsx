import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, CheckCircle2, Clock, Video } from 'lucide-react';

export default function Agenda() {
  const { eventos, fetchEventos } = useStore();

  useEffect(() => {
    fetchEventos();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-aurora-text)] flex items-center">
            <Calendar className="mr-3 text-[var(--color-aurora-primary)]" size={32} />
            Sua Agenda
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)] max-w-xl">
            Seus próximos compromissos sincronizados diretamente do Google Calendar.
          </p>
        </div>
      </div>
      
      <div className="aurora-card p-6 shadow-sm border-t-4 border-t-indigo-400">
        {eventos.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
             <p className="text-slate-600 font-medium">Nenhum compromisso futuro encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {eventos.map(evt => (
                 <div key={evt.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                         <Calendar size={24} />
                     </div>
                     <div className="flex-1">
                         <h4 className="font-bold text-slate-800 text-lg">{evt.titulo}</h4>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2 text-sm text-slate-600">
                             {evt.data && (
                               <span className="flex items-center"><Clock size={16} className="mr-1 text-slate-400"/> 
                                {new Date(evt.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                               </span>
                             )}
                             {evt.link_meet && (
                               <a href={evt.link_meet} target="_blank" rel="noreferrer" className="flex items-center text-indigo-600 font-medium hover:underline hover:text-indigo-800">
                                   <Video size={16} className="mr-1"/> Entrar na Reunião
                               </a>
                             )}
                         </div>
                     </div>
                 </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
