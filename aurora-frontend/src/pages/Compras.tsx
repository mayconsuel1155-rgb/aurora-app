import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Check, Sparkles } from 'lucide-react';

export default function Compras() {
  const { produtos, loading, fetchProdutos, marcarComoComprado } = useStore();

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const listaInvisivel = safeProdutos.filter(p => p && (p.quantidade ?? 0) <= (p.quantidade_minima ?? 0));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Lista de Compras</h1>
        <p className="text-[var(--color-aurora-text-muted)] text-lg font-light">Gerada magicamente para você. Foco no que importa.</p>
      </header>

      {loading ? (
        <div className="space-y-4">
           {[1, 2].map(i => (
             <div key={i} className="aurora-card h-28 animate-pulse bg-slate-200/40"></div>
           ))}
        </div>
      ) : listaInvisivel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 aurora-card border-dashed">
           <div className="p-6 bg-indigo-50/50 rounded-full mb-4 text-[var(--color-aurora-primary)]">
              <Sparkles size={48} strokeWidth={1.5} />
           </div>
           <h3 className="text-xl font-medium text-[var(--color-aurora-text)] mb-2">Você tem tudo que precisa</h3>
           <p className="text-[var(--color-aurora-text-muted)] text-center max-w-sm">
             Sua mente pode descansar hoje. Não há itens faltando no inventário da sua casa.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listaInvisivel.map(produto => (
            <div key={produto.id} className="aurora-card p-5 md:p-6 flex items-center justify-between hover:translate-y-[-2px] hover:shadow-xl transition-smooth">
               <div className="pl-2">
                 <h3 className="font-semibold text-[var(--color-aurora-text)] text-xl">{produto.nome}</h3>
                 <p className="text-sm text-[var(--color-aurora-text-muted)] mt-1 font-light">
                   Acabou (Temos {produto.quantidade}, Mínimo é {produto.quantidade_minima})
                 </p>
               </div>
               <button 
                 onClick={() => marcarComoComprado(produto)}
                 className="flex items-center space-x-2 bg-[var(--color-aurora-primary)] text-white px-5 py-3 rounded-2xl hover:bg-[var(--color-aurora-primary-hover)] transition-smooth font-medium active:scale-95 shadow-lg shadow-[var(--color-aurora-primary)]/20"
               >
                 <Check size={20} strokeWidth={2.5} />
                 <span className="hidden sm:inline">Peguei</span>
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
