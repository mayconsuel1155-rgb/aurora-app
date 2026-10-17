import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, CheckCircle2, Clock, Video, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { getApiErrorMessage, type Evento } from '../api/client';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Agenda() {
  const { eventos, fetchEventos, adicionarEvento, editarEvento, excluirEvento, concluirEvento } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento | null>(null);
  
  const [titulo, setTitulo] = useState('');
  const [dataLocal, setDataLocal] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [eventoParaExcluir, setEventoParaExcluir] = useState<Evento | null>(null);

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
    setActionError('');
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
    } catch (err: unknown) {
        const msg = getApiErrorMessage(err, 'Erro desconhecido');
        setActionError(`Não foi possível salvar: ${msg}. Se necessário, reconecte sua conta do Google.`);
    } finally {
        setLoadingAction(false);
    }
  };

  const handleExcluir = async () => {
      if (!eventoParaExcluir) return;
      try {
        await excluirEvento(eventoParaExcluir.id);
        setEventoParaExcluir(null);
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err, 'Erro desconhecido');
        setActionError(`Não foi possível excluir: ${msg}`);
      }
  };

  const handleConcluir = async (id: string, tituloAtual: string) => {
      if (tituloAtual.startsWith('[Concluído]')) return;
      try {
          await concluirEvento(id, tituloAtual);
      } catch (err: unknown) {
          const msg = getApiErrorMessage(err, 'Erro desconhecido');
          setActionError(`Não foi possível concluir: ${msg}`);
      }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina"
        title="Agenda da casa"
        description="Organize compromissos e acompanhe o que está previsto para os próximos dias."
        action={<button
          onClick={abrirModalNovo}
          className="btn-primary flex w-full items-center justify-center px-4 py-3 sm:w-auto"
        >
          <Plus aria-hidden="true" className="mr-2" size={18} />
          Adicionar compromisso
        </button>}
      />

      {actionError && <div role="alert" className="status-danger rounded-xl border border-current/15 p-4 text-sm font-medium">{actionError}</div>}
      
      <section className="aurora-panel p-4 sm:p-6" aria-label="Compromissos">
        {eventos.length === 0 ? (
          <div className="empty-state">
             <span className="empty-state-icon mb-3"><CheckCircle2 aria-hidden="true" size={23} /></span>
             <p className="font-semibold">Nenhum compromisso agendado.</p>
             <button onClick={abrirModalNovo} className="text-action mt-4 font-semibold hover:underline">
                 Adicionar um compromisso
             </button>
          </div>
        ) : (
          <div className="space-y-4">
             {eventos.map(evt => {
                 const isConcluido = evt.titulo.startsWith('[Concluído]');
                 return (
                 <article key={evt.id} className={`render-item relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4 transition-[background-color,border-color] sm:flex-row sm:items-center ${isConcluido ? 'border-[var(--color-aurora-success)]/25 bg-[var(--color-aurora-success-soft)]' : 'border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)]'}`}>
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
                               aria-label={`Concluir ${evt.titulo}`}
                               className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                             >
                                 <Check size={16} /> <span className="sm:hidden">Concluir</span>
                             </button>
                         )}
                         <button 
                           onClick={() => abrirModalEditar(evt)}
                           title="Editar/Reagendar"
                           aria-label={`Editar ${evt.titulo}`}
                           className="surface-primary-soft flex items-center gap-1 rounded-lg p-2 text-xs font-bold transition-colors hover:bg-[var(--color-aurora-soft)]"
                         >
                             <Edit2 size={16} /> <span className="sm:hidden">Editar</span>
                         </button>
                         <button 
                           onClick={() => setEventoParaExcluir(evt)}
                           title="Excluir"
                           aria-label={`Excluir ${evt.titulo}`}
                           className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                         >
                             <Trash2 size={16} /> <span className="sm:hidden">Excluir</span>
                         </button>
                     </div>
                 </article>
             )})}
          </div>
        )}
      </section>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title">
          <div className="modal-panel max-w-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-aurora-border)] p-6">
              <h3 id="agenda-dialog-title" className="text-xl font-bold">
                {eventoEditando ? 'Reagendar / Editar' : 'Novo Compromisso'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Fechar" className="icon-button bg-[var(--color-aurora-soft)]">
                <X aria-hidden="true" size={20} />
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
                  className="btn-outline flex-1 px-4 py-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="btn-primary flex flex-1 items-center justify-center px-4 py-3"
                >
                  {loadingAction ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(eventoParaExcluir)}
        title="Excluir compromisso"
        description={`O compromisso ${eventoParaExcluir?.titulo.replace('[Concluído] ', '') ?? ''} será removido da agenda.`}
        onConfirm={handleExcluir}
        onCancel={() => setEventoParaExcluir(null)}
      />
    </div>
  );
}
