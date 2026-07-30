import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Check, Sparkles, Trash2, X, DollarSign, Package } from 'lucide-react';
import type { Produto } from '../api/client';

export default function Compras() {
  const { produtos, loading, fetchProdutos, marcarComoComprado, removerProduto } = useStore();
  
  const [comprandoId, setComprandoId] = useState<number | null>(null);
  const [qtdForm, setQtdForm] = useState<string>('1');
  const [precoForm, setPrecoForm] = useState<string>('');

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const safeProdutos = Array.isArray(produtos) ? produtos : [];
  const listaInvisivel = safeProdutos.filter(p => p && (p.quantidade ?? 0) <= (p.quantidade_minima ?? 0));

  const handleIniciarCompra = (produto: Produto) => {
    setComprandoId(produto.id);
    setQtdForm('1');
    setPrecoForm('');
  };

  const handleConfirmarCompra = async (produto: Produto) => {
    const qtd = parseFloat(qtdForm) || 1;
    const preco = parseFloat(precoForm) || 0;
    await marcarComoComprado(produto, qtd, preco);
    setComprandoId(null);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm("Deseja realmente remover este produto de toda a sua casa?")) {
      await removerProduto(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Lista de Compras</h1>
        <p className="text-[var(--color-aurora-text-muted)] text-lg font-light">Gerada magicamente para você. Foco no que importa.</p>
      </header>

      {loading ? (
        <div className="space-y-4">
           {[1, 2].map(i => (
             <div key={i} className="aurora-card h-28 animate-pulse bg-slate-200 dark:bg-slate-700/40"></div>
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
            <div key={produto.id} className="aurora-card overflow-hidden transition-all duration-300 hover:shadow-xl">
              {comprandoId === produto.id ? (
                <div className="p-5 md:p-6 bg-indigo-50/30 dark:bg-indigo-900/10 border-b-2 border-[var(--color-aurora-primary)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[var(--color-aurora-primary)] text-xl flex items-center">
                      <Sparkles size={18} className="mr-2" /> Registrando {produto.nome}
                    </h3>
                    <button onClick={() => setComprandoId(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                        <Package size={14} className="mr-1.5" /> Quantidade (un, kg, L)
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={qtdForm}
                        onChange={(e) => setQtdForm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50 text-lg transition-all"
                        placeholder="Ex: 1.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                        <DollarSign size={14} className="mr-1.5" /> Valor Unitário / Total (R$)
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={precoForm}
                        onChange={(e) => setPrecoForm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50 text-lg transition-all"
                        placeholder="Ex: 12.90"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleConfirmarCompra(produto)}
                    className="w-full flex items-center justify-center space-x-2 bg-[var(--color-aurora-primary)] text-white px-5 py-3.5 rounded-xl hover:bg-[var(--color-aurora-primary-hover)] transition-all font-bold active:scale-[0.98] shadow-lg shadow-[var(--color-aurora-primary)]/30 text-lg"
                  >
                    <Check size={22} strokeWidth={2.5} />
                    <span>Confirmar Compra</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="pl-2">
                    <h3 className="font-semibold text-[var(--color-aurora-text)] text-xl">{produto.nome}</h3>
                    <p className="text-sm text-[var(--color-aurora-text-muted)] mt-1 font-light">
                      Estoque atual: {produto.quantidade} <span className="mx-1">•</span> Mínimo: {produto.quantidade_minima}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExcluir(produto.id)}
                      className="p-3.5 rounded-2xl text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-smooth active:scale-95"
                      title="Excluir produto definitivamente"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleIniciarCompra(produto)}
                      className="flex-1 md:flex-none flex justify-center items-center space-x-2 bg-[var(--color-aurora-primary)] text-white px-6 py-3.5 rounded-2xl hover:bg-[var(--color-aurora-primary-hover)] transition-smooth font-medium active:scale-95 shadow-lg shadow-[var(--color-aurora-primary)]/20"
                    >
                      <Check size={20} strokeWidth={2.5} />
                      <span>Peguei</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
