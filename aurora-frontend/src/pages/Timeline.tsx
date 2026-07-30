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
                <div className="aurora-card p-5 border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/20 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors">
                      <ShoppingCart size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-rose-900 dark:text-rose-300 text-lg transition-colors">Itens em Falta</h3>
                      <p className="text-rose-700 dark:text-rose-400/80 text-sm mt-1 transition-colors">
                        Você tem {timelineData.hoje.produtosFalta.length} produto(s) precisando de reposição urgente.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {timelineData.hoje.produtosFalta.slice(0, 3).map(p => (
                           <span key={p.id} className="text-xs font-bold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-900/50 shadow-sm transition-colors">
                             {p.nome}
                           </span>
                        ))}
                        {timelineData.hoje.produtosFalta.length > 3 && (
                           <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md transition-colors">
                             +{timelineData.hoje.produtosFalta.length - 3} itens
                           </span>
                        )}
                      </div>
                      <div className="mt-4">
                         <Link to="/estoque" className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1 group transition-colors">
                           Ir para Estoque <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                         </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos de Hoje */}
              {timelineData.hoje.eventos.map(evt => (
                <div key={evt.id} className="aurora-card p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg transition-colors">{evt.titulo}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 mt-1 transition-colors">
                        <Clock size={14} />
                        {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {timelineData.hoje.eventos.length === 0 && timelineData.hoje.produtosFalta.length === 0 && (
                <div className="aurora-card p-6 bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center rounded-2xl transition-colors">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400 dark:text-emerald-500 mb-2" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Tudo limpo por hoje!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum compromisso ou alerta pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: AMANHÃ */}
        <div className="relative pt-6">
          <div className="absolute -left-[17px] top-8 bg-indigo-100 dark:bg-indigo-900/50 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center transition-colors">
            <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
          </div>
          <div className="pl-8">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4 opacity-80 transition-colors">Amanhã</h2>
            
            <div className="space-y-4 opacity-90">
              {timelineData.amanha.eventos.map(evt => (
                <div key={evt.id} className="p-4 border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm flex items-center gap-4 transition-colors">
                  <div className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition-colors">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 transition-colors">{evt.titulo}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 transition-colors">
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
            <div className="absolute -left-[17px] top-8 bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center transition-colors">
              <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            </div>
            <div className="pl-8">
              <h2 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-4 opacity-60 transition-colors">Próximos Dias</h2>
              
              <div className="space-y-3 opacity-70">
                {timelineData.futuro.eventos.map(evt => (
                  <div key={evt.id} className="p-3 bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/30 rounded-xl flex items-center justify-between transition-colors">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{evt.titulo}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
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
