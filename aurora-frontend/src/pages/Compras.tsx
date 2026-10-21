import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Check, Sparkles, Trash2, X, DollarSign, Package, QrCode } from 'lucide-react';
import type { Produto } from '../api/client';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import NfceImportDialog from '../components/NfceImportDialog';

export default function Compras() {
  const { produtos, loading, fetchProdutos, marcarComoComprado, removerProduto } = useStore();
  
  const [comprandoId, setComprandoId] = useState<number | null>(null);
  const [qtdForm, setQtdForm] = useState<string>('1');
  const [precoForm, setPrecoForm] = useState<string>('');
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [isNfceDialogOpen, setIsNfceDialogOpen] = useState(false);

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

  const handleExcluir = async () => {
    if (!produtoParaExcluir) return;
    await removerProduto(produtoParaExcluir.id);
    setProdutoParaExcluir(null);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reposição"
        title="Lista de compras"
        description="Itens que chegaram ao limite mínimo e precisam voltar para a casa."
        action={(
          <button type="button" onClick={() => setIsNfceDialogOpen(true)} className="btn-primary flex items-center gap-2 px-4 py-3">
            <QrCode size={19} aria-hidden="true" />
            Escanear nota
          </button>
        )}
      />

      {loading ? (
        <div className="space-y-4">
           {[1, 2].map(i => (
             <div key={i} className="aurora-card h-28 animate-pulse bg-slate-200 dark:bg-slate-700/40"></div>
           ))}
        </div>
      ) : listaInvisivel.length === 0 ? (
        <div className="empty-state">
           <div className="empty-state-icon mb-4">
              <Sparkles aria-hidden="true" size={24} strokeWidth={1.6} />
           </div>
           <h3 className="section-title">Nenhuma compra pendente</h3>
           <p className="section-copy max-w-sm">
             O estoque está acima dos limites mínimos definidos.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listaInvisivel.map(produto => (
            <article key={produto.id} className="aurora-panel render-item transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
              {comprandoId === produto.id ? (
                <div className="border-b-2 border-[var(--color-aurora-primary)] bg-[var(--color-aurora-primary-soft)] p-5 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[var(--color-aurora-primary)] text-xl flex items-center">
                      <Sparkles size={18} className="mr-2" /> Registrando {produto.nome}
                    </h3>
                    <button type="button" onClick={() => setComprandoId(null)} aria-label="Cancelar registro" className="icon-button">
                      <X aria-hidden="true" size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="space-y-1.5">
                      <label htmlFor={`quantidade-${produto.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                        <Package size={14} className="mr-1.5" /> Quantidade ({produto.unidade || 'un'})
                      </label>
                      <input 
                        id={`quantidade-${produto.id}`}
                        name="quantidade"
                        type="number" 
                        step="0.01"
                        min="0.01"
                        value={qtdForm}
                        onChange={(e) => setQtdForm(e.target.value)}
                        className="form-input px-4 py-3 text-lg"
                        placeholder="Ex: 1.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`preco-${produto.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                        <DollarSign size={14} className="mr-1.5" /> Valor Unitário / Total (R$)
                      </label>
                      <input 
                        id={`preco-${produto.id}`}
                        name="preco"
                        type="number" 
                        step="0.01"
                        min="0"
                        value={precoForm}
                        onChange={(e) => setPrecoForm(e.target.value)}
                        className="form-input px-4 py-3 text-lg"
                        placeholder="Ex: 12.90"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleConfirmarCompra(produto)}
                    className="btn-primary flex w-full items-center justify-center space-x-2 px-5 py-3.5 text-lg active:scale-[.98]"
                  >
                    <Check size={22} strokeWidth={2.5} />
                    <span>Registrar compra</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center md:p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-aurora-text)]">{produto.nome}</h3>
                    <p className="mt-1 text-sm text-[var(--color-aurora-text-muted)]">
                      Estoque atual: {produto.quantidade} {produto.unidade || 'un'} <span className="mx-1">•</span> Mínimo: {produto.quantidade_minima} {produto.unidade || 'un'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setProdutoParaExcluir(produto)}
                      aria-label={`Excluir ${produto.nome}`}
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
                      <span>Marcar como comprado</span>
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(produtoParaExcluir)}
        title="Remover produto"
        description={`O item ${produtoParaExcluir?.nome ?? ''} será removido do estoque e da lista de compras.`}
        onConfirm={handleExcluir}
        onCancel={() => setProdutoParaExcluir(null)}
      />
      <NfceImportDialog isOpen={isNfceDialogOpen} onClose={() => setIsNfceDialogOpen(false)} />
    </div>
  );
}
