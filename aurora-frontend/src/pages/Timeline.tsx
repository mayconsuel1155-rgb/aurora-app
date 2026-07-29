import { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, ShoppingCart, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    const eventosHoje = [];
    const eventosAmanha = [];
    const eventosFuturo = [];

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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Clock className="text-[var(--color-aurora-primary)]" size={32} strokeWidth={2} />
          Sua Rotina
        </h1>
        <p className="text-slate-500 text-lg font-light max-w-2xl">
          Tudo o que você precisa focar hoje, organizado em uma única linha do tempo inteligente.
        </p>
      </header>

      <div className="relative border-l-2 border-indigo-100 ml-4 md:ml-6 space-y-12 pb-8">
        
        {/* BLOCO: HOJE */}
        <div className="relative">
          <div className="absolute -left-[25px] bg-white p-1 rounded-full border-2 border-[var(--color-aurora-primary)]">
            <div className="w-4 h-4 bg-[var(--color-aurora-primary)] rounded-full animate-pulse"></div>
          </div>
          <div className="pl-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Hoje</h2>
            
            <div className="space-y-4">
              {/* Alertas de Compras */}
              {timelineData.hoje.produtosFalta.length > 0 && (
                <div className="aurora-card p-5 border-l-4 border-l-rose-500 bg-rose-50/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                      <ShoppingCart size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-rose-900 text-lg">Itens em Falta</h3>
                      <p className="text-rose-700 text-sm mt-1">
                        Você tem {timelineData.hoje.produtosFalta.length} produto(s) precisando de reposição urgente.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {timelineData.hoje.produtosFalta.slice(0, 3).map(p => (
                           <span key={p.id} className="text-xs font-bold bg-white text-rose-600 px-2 py-1 rounded-md border border-rose-100 shadow-sm">
                             {p.nome}
                           </span>
                        ))}
                        {timelineData.hoje.produtosFalta.length > 3 && (
                           <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-md">
                             +{timelineData.hoje.produtosFalta.length - 3} itens
                           </span>
                        )}
                      </div>
                      <div className="mt-4">
                         <Link to="/despensa" className="text-sm font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 group">
                           Ir para Despensa <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                         </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Eventos de Hoje */}
              {timelineData.hoje.eventos.map(evt => (
                <div key={evt.id} className="aurora-card p-5 border-l-4 border-l-indigo-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">{evt.titulo}</h3>
                      <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                        <Clock size={14} />
                        {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {timelineData.hoje.eventos.length === 0 && timelineData.hoje.produtosFalta.length === 0 && (
                <div className="aurora-card p-6 bg-slate-50 border border-dashed border-slate-200 text-center rounded-2xl">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                  <h3 className="font-bold text-slate-700">Tudo limpo por hoje!</h3>
                  <p className="text-slate-500 text-sm">Nenhum compromisso ou alerta pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: AMANHÃ */}
        <div className="relative pt-6">
          <div className="absolute -left-[17px] top-8 bg-indigo-100 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
          </div>
          <div className="pl-8">
            <h2 className="text-xl font-bold text-slate-700 mb-4 opacity-80">Amanhã</h2>
            
            <div className="space-y-4 opacity-90">
              {timelineData.amanha.eventos.map(evt => (
                <div key={evt.id} className="p-4 border border-slate-100 bg-white rounded-xl shadow-sm flex items-center gap-4">
                  <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">{evt.titulo}</h3>
                    <p className="text-slate-400 text-xs mt-1">
                        {evt.data && evt.data.includes('T') ? new Date(evt.data).toLocaleTimeString('pt-BR', {timeStyle: 'short'}) : 'Dia Inteiro'}
                    </p>
                  </div>
                </div>
              ))}

              {timelineData.amanha.eventos.length === 0 && (
                <p className="text-slate-400 text-sm italic">Nenhum compromisso para amanhã.</p>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO: FUTURO */}
        {timelineData.futuro.eventos.length > 0 && (
          <div className="relative pt-6">
            <div className="absolute -left-[17px] top-8 bg-slate-100 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
            </div>
            <div className="pl-8">
              <h2 className="text-xl font-bold text-slate-500 mb-4 opacity-60">Próximos Dias</h2>
              
              <div className="space-y-3 opacity-70">
                {timelineData.futuro.eventos.map(evt => (
                  <div key={evt.id} className="p-3 bg-white/50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <span className="font-semibold text-slate-600">{evt.titulo}</span>
                      <span className="text-xs text-slate-400 font-medium">
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
