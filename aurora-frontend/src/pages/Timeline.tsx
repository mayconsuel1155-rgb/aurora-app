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
      <header className="space-y-1 mb-8 flex flex-col items-start">
        <span className="ui-label ui-label-gray mb-3">Timeline</span>
        <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-[#EDEDED]">
          Sua Rotina
        </h1>
        <p className="text-[#666666] dark:text-[#A1A1AA] text-sm">
          Tudo o que você precisa focar hoje, organizado de forma simples.
        </p>
      </header>

      <div className="relative border-l border-[#EAEAEA] dark:border-[#262626] ml-4 md:ml-6 space-y-10 pb-8 transition-colors">
        
        {/* BLOCO: HOJE */}
        <div className="relative">
          <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-[#171717] dark:bg-[#EDEDED] rounded-full border-2 border-white dark:border-[#000000]"></div>
          <div className="pl-6">
            <span className="ui-label ui-label-gray mb-2">Agora</span>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#EDEDED] mb-4 tracking-tight">Hoje</h2>
            
            <div className="space-y-4">
              {/* Alertas de Compras */}
              {timelineData.hoje.produtosFalta.length > 0 && (
                <div className="aurora-card p-4 relative overflow-hidden group border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-900/50">
                      <ShoppingCart className="text-red-600 dark:text-red-400" size={14} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Alerta de Reposição</h3>
                      <p className="text-[#666666] dark:text-[#A1A1AA] text-xs mt-0.5">
                        <span className="font-semibold">{timelineData.hoje.produtosFalta.length} itens</span> essenciais em falta.
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
                      <div className="mt-4">
                         <Link to="/estoque" className="btn-primary inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700">
                           Repor Estoque <ArrowRight size={12} strokeWidth={2} />
                         </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos de Hoje */}
              {timelineData.hoje.eventos.map(evt => (
                <div key={evt.id} className="aurora-card p-4 group hover:border-[#171717] dark:hover:border-[#EDEDED] transition-smooth cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#F4F4F5] dark:bg-[#171717] rounded-md border border-[#EAEAEA] dark:border-[#262626]">
                      <Calendar className="text-[#171717] dark:text-[#EDEDED]" size={14} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-[#171717] dark:text-[#EDEDED] text-sm">{evt.titulo}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="text-[#A1A1AA] dark:text-[#666666]" size={10} />
                        <span className="text-[#666666] dark:text-[#A1A1AA] text-xs">
                          {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {timelineData.hoje.eventos.length === 0 && timelineData.hoje.produtosFalta.length === 0 && (
                <div className="p-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] border border-dashed border-[#EAEAEA] dark:border-[#262626] text-center rounded-lg transition-colors">
                  <CheckCircle2 size={24} className="mx-auto text-[#171717] dark:text-[#EDEDED] mb-2 opacity-50" />
                  <h3 className="font-medium text-[#171717] dark:text-[#EDEDED] text-sm">Tudo limpo por hoje.</h3>
                  <p className="text-[#666666] dark:text-[#A1A1AA] text-xs mt-1">Nenhum compromisso ou alerta pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: AMANHÃ */}
        <div className="relative pt-6">
          <div className="absolute -left-[5px] top-7 w-2.5 h-2.5 bg-[#EAEAEA] dark:bg-[#262626] rounded-full border-2 border-white dark:border-[#000000]"></div>
          <div className="pl-6">
            <h2 className="text-sm font-semibold text-[#666666] dark:text-[#A1A1AA] mb-4 uppercase tracking-wider">Amanhã</h2>
            
            <div className="space-y-2">
              {timelineData.amanha.eventos.map(evt => (
                <div key={evt.id} className="aurora-card p-3 flex items-center gap-3 hover:border-[#171717] dark:hover:border-[#EDEDED] transition-smooth cursor-default">
                  <div className="p-1.5 bg-[#F4F4F5] dark:bg-[#171717] text-[#666666] dark:text-[#A1A1AA] rounded-md border border-[#EAEAEA] dark:border-[#262626]">
                    <Calendar size={12} />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#171717] dark:text-[#EDEDED] text-sm">{evt.titulo}</h3>
                    <p className="text-[#666666] dark:text-[#A1A1AA] text-[10px] mt-0.5">
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
            <div className="absolute -left-[5px] top-7 w-2.5 h-2.5 bg-[#EAEAEA] dark:bg-[#262626] rounded-full border-2 border-white dark:border-[#000000]"></div>
            <div className="pl-6">
              <h2 className="text-sm font-semibold text-[#666666] dark:text-[#A1A1AA] mb-4 uppercase tracking-wider">Próximos Dias</h2>
              
              <div className="space-y-2">
                {timelineData.futuro.eventos.map(evt => (
                  <div key={evt.id} className="aurora-card p-3 flex items-center justify-between hover:border-[#171717] dark:hover:border-[#EDEDED] transition-smooth">
                      <span className="font-medium text-[#171717] dark:text-[#EDEDED] text-sm">{evt.titulo}</span>
                      <span className="text-[10px] text-[#666666] dark:text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#171717] border border-[#EAEAEA] dark:border-[#262626] px-2 py-0.5 rounded-md">
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
