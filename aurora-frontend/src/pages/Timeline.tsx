import { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, ShoppingCart, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Evento } from '../api/client';

export default function Timeline() {
  const { eventos, produtos, fetchEventos, fetchProdutos } = useStore();

  useEffect(() => {
    fetchEventos();
    fetchProdutos();
  }, []);

  // Processamento dos dados para a Timeline
  const timelineData = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dpsAmanha = new Date(hoje);
    dpsAmanha.setDate(dpsAmanha.getDate() + 2);

    const eventosHoje: Evento[] = [];
    const eventosAmanha: Evento[] = [];
    const eventosFuturo: Evento[] = [];

    // Categorizar Eventos
    eventos.forEach(evt => {
      if (evt.titulo.startsWith('[Concluído]')) return; // Esconder concluídos da timeline
      
      let dataEvt = new Date();
      if (evt.data) {
          if (evt.data.includes('T')) {
              dataEvt = new Date(evt.data);
          } else {
              dataEvt = new Date(evt.data + "T12:00:00");
          }
      }

      dataEvt.setHours(0, 0, 0, 0);

      if (dataEvt.getTime() === hoje.getTime()) {
        eventosHoje.push(evt);
      } else if (dataEvt.getTime() === amanha.getTime()) {
        eventosAmanha.push(evt);
      } else if (dataEvt.getTime() >= dpsAmanha.getTime()) {
        eventosFuturo.push(evt);
      }
    });

    // Identificar Produtos em falta (sempre mostrados em "Hoje" como Alerta)
    const produtosFalta = produtos.filter(p => p.quantidade <= p.quantidade_minima);

    return {
      hoje: { eventos: eventosHoje, produtosFalta },
      amanha: { eventos: eventosAmanha },
      futuro: { eventos: eventosFuturo }
    };
  }, [eventos, produtos]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3 transition-colors">
          <Clock className="text-[var(--color-aurora-primary)] dark:text-indigo-400" size={32} strokeWidth={2} />
          Sua Rotina
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light max-w-2xl transition-colors">
          Tudo o que você precisa focar hoje, organizado em uma única linha do tempo inteligente.
        </p>
      </header>

      <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-4 md:ml-6 space-y-12 pb-8 transition-colors">
        
        {/* BLOCO: HOJE */}
        <div className="relative">
          <div className="absolute -left-[25px] bg-white dark:bg-slate-900 p-1 rounded-full border-2 border-[var(--color-aurora-primary)] dark:border-indigo-500 transition-colors">
            <div className="w-4 h-4 bg-[var(--color-aurora-primary)] dark:bg-indigo-400 rounded-full animate-pulse"></div>
          </div>
          <div className="pl-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 transition-colors">Hoje</h2>
            
            <div className="space-y-4">
              {/* Alertas de Compras */}
              {timelineData.hoje.produtosFalta.length > 0 && (
                <div className="relative overflow-hidden bg-white dark:bg-slate-800/90 rounded-2xl border border-rose-100 dark:border-rose-900/40 shadow-sm hover:shadow-md transition-all p-5">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <div className="flex items-start gap-4 pl-1">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100/50 dark:border-rose-500/20">
                      <ShoppingCart className="text-rose-500" size={22} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg tracking-tight">Alerta de Reposição</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                        Você tem <span className="font-semibold text-rose-600 dark:text-rose-400">{timelineData.hoje.produtosFalta.length} itens</span> essenciais em falta.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {timelineData.hoje.produtosFalta.slice(0, 3).map(p => (
                           <span key={p.id} className="text-[11px] font-medium bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">
                             {p.nome}
                           </span>
                        ))}
                        {timelineData.hoje.produtosFalta.length > 3 && (
                           <span className="text-[11px] font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full">
                             +{timelineData.hoje.produtosFalta.length - 3}
                           </span>
                        )}
                      </div>
                      <div className="mt-5">
                         <Link to="/estoque" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-rose-500/20">
                           Repor Estoque <ArrowRight size={16} />
                         </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos de Hoje */}
              {timelineData.hoje.eventos.map(evt => (
                <div key={evt.id} className="relative group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all p-4">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center gap-4 pl-1">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl border border-indigo-50 dark:border-indigo-500/10">
                      <Calendar className="text-indigo-500" size={22} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">{evt.titulo}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="text-slate-400" size={14} />
                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                          {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {timelineData.hoje.eventos.length === 0 && timelineData.hoje.produtosFalta.length === 0 && (
                <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/50 text-center rounded-3xl transition-colors">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-400 dark:text-emerald-500/80 mb-3" />
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">Tudo limpo por hoje!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Nenhum compromisso ou alerta pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: AMANHÃ */}
        <div className="relative pt-6">
          <div className="absolute -left-[17px] top-8 bg-indigo-50 dark:bg-indigo-900/30 w-8 h-8 rounded-full border-4 border-slate-50 dark:border-[var(--color-aurora-bg)] flex items-center justify-center transition-colors">
            <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
          </div>
          <div className="pl-8">
            <h2 className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-4 transition-colors">Amanhã</h2>
            
            <div className="space-y-3">
              {timelineData.amanha.eventos.map(evt => (
                <div key={evt.id} className="group p-4 bg-transparent border border-slate-200 dark:border-slate-700/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{evt.titulo}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-medium transition-colors">
                        {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                    </p>
                  </div>
                </div>
              ))}

              {timelineData.amanha.eventos.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm italic transition-colors">Nenhum compromisso para amanhã.</p>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: FUTURO */}
        {timelineData.futuro.eventos.length > 0 && (
          <div className="relative pt-6">
            <div className="absolute -left-[17px] top-8 bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full border-4 border-slate-50 dark:border-[var(--color-aurora-bg)] flex items-center justify-center transition-colors">
              <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            </div>
            <div className="pl-8">
              <h2 className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-4 transition-colors">Próximos Dias</h2>
              
              <div className="space-y-2">
                {timelineData.futuro.eventos.map(evt => (
                  <div key={evt.id} className="group p-3 bg-transparent hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 rounded-xl flex items-center justify-between transition-all">
                      <span className="font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{evt.titulo}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md transition-colors">
                          {evt.data ? new Date(evt.data.includes('T') ? evt.data : evt.data + "T12:00:00").toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) : ''}
                      </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
