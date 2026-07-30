import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PackageX, CheckCircle2, ArrowRight, Sparkles, AlertTriangle, Info, Package, Plus, Minus, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import TimelineCard from '../components/TimelineCard';
import MorningBriefingModal from '../components/MorningBriefingModal';

export default function Dashboard() {
  const { produtos, insight, loading, fetchProdutos, fetchInsight, alterarQuantidade, fetchEventos, eventos } = useStore();

  useEffect(() => {
    fetchProdutos();
    fetchInsight();
    fetchEventos();
  }, [fetchProdutos, fetchInsight, fetchEventos]);

  if (loading && produtos.length === 0) return (
     <div className="animate-pulse space-y-8">
        <div className="h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 aurora-card w-full"></div>
          <div className="h-44 aurora-card w-full"></div>
        </div>
     </div>
  );

  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const itensEmFalta = safeProdutos.filter(p => p && (p.quantidade ?? 0) <= (p.quantidade_minima ?? 0));
  const itensAbastecidos = safeProdutos.filter(p => p && (p.quantidade ?? 0) > (p.quantidade_minima ?? 0));

  const isVencendo = (dataStr?: string) => {
    if (!dataStr) return false;
    const validade = new Date(dataStr);
    const hoje = new Date();
    const diffTime = validade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };
  
  const isVencido = (dataStr?: string) => {
    if (!dataStr) return false;
    const validade = new Date(dataStr);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    return validade < hoje;
  };

  const itensVencendoOuVencidos = safeProdutos.filter(p => p && (isVencendo(p.validade) || isVencido(p.validade)));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <MorningBriefingModal />
      
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Olá, bem-vindo(a)</h1>
        <p className="text-[var(--color-aurora-text-muted)] text-lg md:text-xl font-light">Sua casa está sendo gerenciada silenciosamente.</p>
      </header>

      {/* Main Status Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Status do Estoque */}
        <div className="aurora-card p-6 md:p-8 flex flex-col justify-between transition-smooth hover:translate-y-[-2px] hover:shadow-xl col-span-1 lg:col-span-1">
          <div>
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-3xl backdrop-blur-md ${itensEmFalta.length > 0 ? 'bg-amber-100/60 text-amber-600' : 'bg-emerald-100/60 text-emerald-600'}`}>
                {itensEmFalta.length > 0 ? <PackageX size={32} strokeWidth={1.5} /> : <CheckCircle2 size={32} strokeWidth={1.5} />}
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                {safeProdutos.length} {safeProdutos.length === 1 ? 'produto registrado' : 'produtos registrados'}
              </span>
            </div>
            
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-semibold">Status do Estoque</h2>
              <p className="text-[var(--color-aurora-text-muted)]">
                  {itensEmFalta.length > 0 ? `${itensEmFalta.length} itens precisam de reposição` : 'Tudo abastecido e tranquilo para hoje.'}
              </p>
            </div>
          </div>
          
          {itensEmFalta.length > 0 ? (
             <Link to="/compras" className="group flex items-center justify-between w-full py-4 px-6 bg-[var(--color-aurora-text)] text-white rounded-2xl hover:bg-black transition-smooth font-medium active:scale-95 shadow-lg shadow-black/10">
               <span>Ver Lista de Compras ({itensEmFalta.length})</span>
               <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          ) : (
            <div className="w-full text-center py-4 px-6 bg-slate-100 dark:bg-slate-800/50 text-slate-400 rounded-2xl font-medium border border-slate-200 dark:border-slate-700/50">
               Nenhuma compra necessária
            </div>
          )}
        </div>

        {/* Card 2: Inteligência Aurora (Insights) */}
        <div className="aurora-card p-6 md:p-8 flex flex-col justify-between transition-smooth hover:translate-y-[-2px] hover:shadow-xl bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 col-span-1 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-3xl bg-indigo-100/70 text-[var(--color-aurora-primary)] backdrop-blur-md">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-100/80 text-indigo-700 rounded-full">
                Inteligência Aurora
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-semibold">Insight da Casa</h2>
              {insight ? (
                <div className="flex items-start space-x-3 mt-3">
                  {insight.tipo === 'alerta' && <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />}
                  {insight.tipo === 'sucesso' && <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />}
                  {insight.tipo === 'info' && <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />}
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                    {insight.mensagem}
                  </p>
                </div>
              ) : (
                <p className="text-[var(--color-aurora-text-muted)]">
                  Analisando padrões de consumo da sua residência...
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-[var(--color-aurora-text-muted)] font-light">
            Memória digital ativa • Reduzindo carga mental
          </div>
        </div>

        {/* Card 3: Aurora Timeline (Calendar) */}
        <div className="col-span-1 lg:col-span-1">
          <TimelineCard eventos={eventos} />
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-3 gap-4">
        <div className="aurora-card p-4 md:p-6 text-center">
          <p className="text-xs text-[var(--color-aurora-text-muted)] uppercase tracking-wider font-semibold mb-1">Total</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">{safeProdutos.length}</p>
        </div>
        <div className="aurora-card p-4 md:p-6 text-center">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">OK</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-600">{itensAbastecidos.length}</p>
        </div>
        <div className="aurora-card p-4 md:p-6 text-center">
          <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold mb-1">Repor</p>
          <p className="text-2xl md:text-3xl font-bold text-amber-600">{itensEmFalta.length}</p>
        </div>
      </section>

      {/* Rapid Action Inventory Section on Dashboard */}
      {itensEmFalta.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package size={20} className="text-amber-500" />
              Itens Precisando de Reposição Rápida
            </h2>
            <Link to="/estoque" className="text-sm font-medium text-[var(--color-aurora-primary)] hover:underline">
              Ir para Inventário →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itensEmFalta.map(produto => (
              <div key={produto.id} className="aurora-card p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{produto.nome}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estoque atual: <span className="font-bold text-amber-600">{produto.quantidade}</span> (Mínimo: {produto.quantidade_minima})
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => alterarQuantidade(produto.id, -1)}
                    disabled={produto.quantidade === 0}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-200 rounded-xl transition-all disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">{produto.quantidade}</span>
                  <button 
                    onClick={() => alterarQuantidade(produto.id, 1)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-800 hover:text-slate-800 dark:text-slate-200 rounded-xl transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seção de Validade */}
      {itensVencendoOuVencidos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock size={20} className="text-rose-500" />
              Atenção: Consumir em Breve
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {itensVencendoOuVencidos.map(produto => {
              const vencido = isVencido(produto.validade);
              return (
                <div key={produto.id} className={`aurora-card p-5 border-l-4 ${vencido ? 'border-l-rose-500 bg-rose-50/30' : 'border-l-orange-400 bg-orange-50/30'}`}>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{produto.nome}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock size={14} className={vencido ? 'text-rose-600' : 'text-orange-600'} />
                    <span className={`text-sm font-medium ${vencido ? 'text-rose-600' : 'text-orange-600'}`}>
                      {vencido ? 'Vencido' : 'Vence em breve'} ({new Date(produto.validade!).toLocaleDateString('pt-BR')})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
