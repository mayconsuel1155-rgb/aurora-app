import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, CheckCircle2, Clock, Video, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import type { Evento } from '../api/client';

export default function Agenda() {
  const { eventos, fetchEventos, adicionarEvento, editarEvento, excluirEvento, concluirEvento } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [dataLocal, setDataLocal] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const abrirModalNovo = () => {
    setEventoEditando(null);
    setTitulo('');
    setDataLocal('');
    setIsAllDay(false);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (evt: Evento) => {
    setEventoEditando(evt);
    setTitulo(evt.titulo.replace('[Concluído] ', ''));
    
    if (evt.data) {
        // Formatar para datetime-local input YYYY-MM-DDThh:mm
        const date = new Date(evt.data);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        
        if (evt.data.includes('T')) {
           setDataLocal(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
           setIsAllDay(false);
        } else {
           setDataLocal(`${yyyy}-${mm}-${dd}`);
           setIsAllDay(true);
        }
    }
    setIsModalOpen(true);
  };

  const salvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
        let dt = dataLocal;
        if (!isAllDay && dt.length === 16) {
           dt = dt + ':00-03:00'; // Formato ISO com timezone BR
        }

        if (eventoEditando) {
            await editarEvento(eventoEditando.id, { titulo, data: dt, is_all_day: isAllDay });
        } else {
            await adicionarEvento({ titulo, data: dt, is_all_day: isAllDay });
        }
        setIsModalOpen(false);
    } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || "Erro desconhecido";
        alert(`Não foi possível salvar o compromisso: ${msg}\n\nSe necessário, reconecte sua conta do Google e tente novamente.`);
    } finally {
        setLoadingAction(false);
    }
  };

  const handleExcluir = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir este compromisso?")) {
          try {
             await excluirEvento(id);
          } catch (err: any) {
             const msg = err.response?.data?.detail || err.message || "Erro desconhecido";
             alert(`Erro ao excluir: ${msg}`);
          }
      }
  };

  const handleConcluir = async (id: string, tituloAtual: string) => {
      if (tituloAtual.startsWith('[Concluído]')) return;
      try {
          await concluirEvento(id, tituloAtual);
      } catch (err: any) {
          const msg = err.response?.data?.detail || err.message || "Erro desconhecido";
          alert(`Erro ao concluir: ${msg}`);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-aurora-text)] flex items-center">
            <Calendar className="mr-3 text-[var(--color-aurora-primary)]" size={32} />
            Agenda
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)] max-w-xl">
            Organize compromissos e acompanhe o que está previsto para os próximos dias.
          </p>
        </div>
        <button
          onClick={abrirModalNovo}
          className="flex items-center rounded-xl bg-[var(--color-aurora-primary)] px-4 py-2 text-sm font-bold text-white shadow-md transition-[background-color,transform] hover:bg-[var(--color-aurora-primary-hover)] active:scale-95"
        >
          <Plus className="mr-2" size={18} />
          Adicionar compromisso
        </button>
      </div>
      
      <div className="aurora-card border-t-4 border-t-[var(--color-aurora-accent)] p-6 shadow-sm">
        {eventos.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
             <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
             <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum compromisso agendado.</p>
             <button onClick={abrirModalNovo} className="text-action mt-4 font-semibold hover:underline">
                 Adicionar um compromisso
             </button>
          </div>
        ) : (
          <div className="space-y-4">
             {eventos.map(evt => {
                 const isConcluido = evt.titulo.startsWith('[Concluído]');
                 return (
                 <div key={evt.id} className={`p-4 border rounded-xl bg-white dark:bg-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden ${isConcluido ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 dark:border-slate-700'}`}>
                     {isConcluido && (
                         <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                     )}
                     
                     <div className={`shrink-0 rounded-lg p-3 ${isConcluido ? 'bg-emerald-100 text-emerald-600' : 'surface-primary-soft'}`}>
                         {isConcluido ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                     </div>
                     
                     <div className="flex-1">
                         <h4 className={`font-bold text-lg ${isConcluido ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300' : 'text-slate-800 dark:text-slate-200'}`}>
                             {evt.titulo.replace('[Concluído] ', '')}
                         </h4>
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                             {evt.data && (
                               <span className="flex items-center"><Clock size={16} className="mr-1 text-slate-400"/> 
                                {evt.data.includes('T') ? new Date(evt.data).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : new Date(evt.data + "T12:00:00").toLocaleDateString('pt-BR', { dateStyle: 'long'})}
                               </span>
                             )}
                             {evt.link_meet && (
                               <a href={evt.link_meet} target="_blank" rel="noreferrer" className="text-action flex items-center font-medium hover:underline">
                                   <Video size={16} className="mr-1"/> Entrar na Reunião
                               </a>
                             )}
                         </div>
                     </div>
                     
                     <div className="flex items-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-700 w-full sm:w-auto justify-end">
                         {!isConcluido && (
                             <button 
                               onClick={() => handleConcluir(evt.id, evt.titulo)}
                               title="Marcar como Concluído"
                               className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                             >
                                 <Check size={16} /> <span className="sm:hidden">Concluir</span>
                             </button>
                         )}
                         <button 
                           onClick={() => abrirModalEditar(evt)}
                           title="Editar/Reagendar"
                           className="surface-primary-soft flex items-center gap-1 rounded-lg p-2 text-xs font-bold transition-colors hover:bg-[var(--color-aurora-soft)]"
                         >
                             <Edit2 size={16} /> <span className="sm:hidden">Editar</span>
                         </button>
                         <button 
                           onClick={() => handleExcluir(evt.id)}
                           title="Excluir"
                           className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                         >
                             <Trash2 size={16} /> <span className="sm:hidden">Excluir</span>
                         </button>
                     </div>
                 </div>
             )})}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101713]/55 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {eventoEditando ? 'Reagendar / Editar' : 'Novo Compromisso'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={salvarEvento} className="p-6 space-y-5">
              <div>
                <label htmlFor="evento-titulo" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do compromisso</label>
                <input
                  id="evento-titulo"
                  name="titulo"
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex.: Consulta médica"
                  className="form-input px-4 py-3"
                />
              </div>
              
              <div className="flex items-center gap-3">
                  <input 
                      type="checkbox" 
                      id="allday"
                      checked={isAllDay}
                      onChange={e => setIsAllDay(e.target.checked)}
                      className="h-5 w-5 rounded text-[var(--color-aurora-primary)] focus:ring-[var(--color-aurora-primary)]"
                  />
                  <label htmlFor="allday" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Evento de dia inteiro (sem horário)</label>
              </div>

              <div>
                <label htmlFor="evento-data" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Data {isAllDay ? '' : 'e hora'}</label>
                <input
                  id="evento-data"
                  name="data"
                  type={isAllDay ? "date" : "datetime-local"}
                  required
                  value={dataLocal}
                  onChange={e => setDataLocal(e.target.value)}
                  className="form-input px-4 py-3"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex flex-1 items-center justify-center rounded-xl bg-[var(--color-aurora-primary)] px-4 py-3 font-bold text-white shadow-md transition-colors hover:bg-[var(--color-aurora-primary-hover)]"
                >
                  {loadingAction ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
