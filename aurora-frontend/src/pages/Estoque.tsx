import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus, PackageOpen, X, Search, MapPin, Tag, Trash2, AlertTriangle, Settings2, Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { GestaoAmbientesModal } from '../components/GestaoAmbientesModal';
import { GestaoCategoriasModal } from '../components/GestaoCategoriasModal';
import type { Produto } from '../api/client';
import PageHeader from '../components/PageHeader';

export default function Estoque() {
  const { produtos, ambientes, categoriasProduto, loading, fetchProdutos, fetchAmbientes, fetchCategoriasProduto, alterarQuantidade, adicionarProduto, removerProduto } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGestaoAmbientesModalOpen, setIsGestaoAmbientesModalOpen] = useState(false);
  const [isGestaoCategoriasModalOpen, setIsGestaoCategoriasModalOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [busca, setBusca] = useState('');
  const [ambienteFiltroId, setAmbienteFiltroId] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    categoria: '',
    ambiente_id: 0,
    quantidade: 1,
    quantidade_minima: 1,
    validade: ''
  });

  useEffect(() => {
    fetchProdutos();
    fetchAmbientes();
    fetchCategoriasProduto();
  }, [fetchProdutos, fetchAmbientes, fetchCategoriasProduto]);

  useEffect(() => {
    if (ambientes.length > 0 && novoProduto.ambiente_id === 0) {
      setNovoProduto(prev => ({ ...prev, ambiente_id: ambientes[0].id }));
    }
  }, [ambientes, novoProduto.ambiente_id]);

  useEffect(() => {
    if (categoriasProduto.length > 0 && novoProduto.categoria === '') {
      setNovoProduto(prev => ({ ...prev, categoria: categoriasProduto[0].nome }));
    }
  }, [categoriasProduto, novoProduto.categoria]);

  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const { validade, ...produtoSemValidade } = novoProduto;
    const payload = validade ? novoProduto : produtoSemValidade;
    await adicionarProduto(payload);
    setIsModalOpen(false);
    setNovoProduto({
      nome: '',
      categoria: categoriasProduto.length > 0 ? categoriasProduto[0].nome : '',
      ambiente_id: ambientes.length > 0 ? ambientes[0].id : 0,
      quantidade: 1,
      quantidade_minima: 1,
      validade: ''
    });
  };

  const handleConfirmarExclusao = async () => {
    if (produtoParaExcluir) {
      await removerProduto(produtoParaExcluir.id);
      setProdutoParaExcluir(null);
    }
  };

  const safeProdutos = Array.isArray(produtos) ? produtos : [];

  const produtosFiltrados = safeProdutos.filter(p => {
    if (!p) return false;
    const nomeMatch = (p.nome ?? '').toLowerCase().includes(busca.toLowerCase());
    const categoriaMatch = (p.categoria ?? '').toLowerCase().includes(busca.toLowerCase());
    const ambienteMatch = ambienteFiltroId === null || p.ambiente_id === ambienteFiltroId;
    const catFiltroMatch = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;

    return (nomeMatch || categoriaMatch) && ambienteMatch && catFiltroMatch;
  });

  const valorTotal = safeProdutos.reduce((acc, p) => acc + ((p.quantidade ?? 0) * (p.preco ?? 0)), 0);
  const produtoMaisValioso = safeProdutos.reduce((prev, curr) => 
    ((curr.quantidade ?? 0) * (curr.preco ?? 0)) > ((prev?.quantidade ?? 0) * (prev?.preco ?? 0)) ? curr : prev
  , safeProdutos[0] || null);

  // Função para verificar vencimento (menor que 3 dias)
  const isVencendo = (dataStr?: string) => {
    if (!dataStr) return false;
    const validade = new Date(dataStr);
    const hoje = new Date();
    const diffTime = validade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };
  
  const isVencido = (dataStr?: string) => {
    if (!dataStr) return false;
    const validade = new Date(dataStr);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    return validade < hoje;
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Inventário"
        title="Estoque da casa"
        description="Acompanhe quantidades, validade, localização e valor estimado dos produtos."
        action={<button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex w-full items-center justify-center px-5 py-3 sm:w-auto"
        >
          <Plus size={18} strokeWidth={2} className="mr-2" /> Adicionar produto
        </button>}
      />

      {/* Dashboard Financeiro */}
      <section className="aurora-ledger md:grid-cols-2" aria-label="Resumo do estoque">
        <div className="relative overflow-hidden bg-[var(--color-aurora-primary)] p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="rounded-xl bg-white/12 p-2">
              <Wallet size={20} className="text-white" />
            </div>
            <h3 className="font-medium text-emerald-50 tracking-wide text-sm">Valor total do estoque</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold opacity-80">R$</span>
            <span className="text-5xl font-extrabold tracking-tight">{valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="mt-3 text-emerald-100 text-sm opacity-90 flex items-center">
            <TrendingUp size={14} className="mr-1.5" /> Soma estimada dos produtos cadastrados
          </p>
        </div>

        {produtoMaisValioso && ((produtoMaisValioso.quantidade ?? 0) * (produtoMaisValioso.preco ?? 0)) > 0 && (
          <div className="relative overflow-hidden border-t border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-6 md:border-l md:border-t-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="surface-primary-soft rounded-xl p-2">
                <DollarSign size={20} />
              </div>
              <h3 className="font-medium text-slate-500 dark:text-slate-400 tracking-wide text-sm">Produto de maior valor</h3>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[var(--color-aurora-text)] truncate">{produtoMaisValioso.nome}</h4>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
                Temos {produtoMaisValioso.quantidade} no valor de R$ {(produtoMaisValioso.preco ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada.
              </p>
            </div>
            <div className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span>Total: R$ {((produtoMaisValioso.quantidade ?? 0) * (produtoMaisValioso.preco ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </section>

      {/* Controles de Busca e Filtros */}
      <section className="aurora-panel space-y-5 p-4 sm:p-5" aria-label="Busca e filtros">
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="busca-estoque"
            name="busca"
            aria-label="Buscar produto"
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto por nome ou categoria…"
            className="form-input w-full py-3.5 pl-12 pr-4"
          />
          {busca && (
            <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400">
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>

        {/* Filtros por Ambiente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--color-aurora-text-muted)]">
              <MapPin size={14} />
              <span>Ambiente</span>
            </div>
            <button 
              onClick={() => setIsGestaoAmbientesModalOpen(true)}
              className="flex items-center space-x-1 text-xs font-medium text-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary-hover)] transition-colors"
            >
              <Settings2 size={14} />
              <span>Gerenciar ambientes</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAmbienteFiltroId(null)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-[color,background-color,border-color] ${
                ambienteFiltroId === null
                  ? 'bg-[var(--color-aurora-primary)] text-white shadow-md shadow-[var(--color-aurora-primary)]/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:bg-slate-900/50'
              }`}
            >
              Todos
            </button>
            {ambientes.map(amb => (
              <button
                key={amb.id}
                onClick={() => setAmbienteFiltroId(amb.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-[color,background-color,border-color] ${
                  ambienteFiltroId === amb.id
                    ? 'bg-[var(--color-aurora-primary)] text-white shadow-md shadow-[var(--color-aurora-primary)]/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                {amb.icone} {amb.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros por Categoria */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--color-aurora-text-muted)]">
              <Tag size={14} />
              <span>Categoria</span>
            </div>
            <button 
              onClick={() => setIsGestaoCategoriasModalOpen(true)}
              className="flex items-center space-x-1 text-xs font-medium text-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary-hover)] transition-colors"
            >
              <Settings2 size={14} />
              <span>Gerenciar categorias</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Todas', ...categoriasProduto.map(c => c.nome)].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-medium transition-[color,background-color,border-color] ${
                  categoriaFiltro === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {[1, 2, 3].map(i => (
             <div key={i} className="aurora-card h-48 animate-pulse bg-slate-200 dark:bg-slate-700/40"></div>
           ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="empty-state">
           <div className="empty-state-icon mb-4">
              <PackageOpen aria-hidden="true" size={24} strokeWidth={1.6} />
           </div>
           <h3 className="section-title">Nenhum produto encontrado</h3>
           <p className="section-copy max-w-sm">
             {safeProdutos.length === 0
               ? 'Adicione o primeiro produto para começar a acompanhar o estoque.'
               : 'Nenhum produto corresponde à busca ou aos filtros selecionados.'}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {produtosFiltrados.map(produto => (
            <article key={produto?.id} className="aurora-panel render-item group relative flex flex-col justify-between p-6 transition-smooth hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg leading-tight text-[var(--color-aurora-text)] pr-2">{produto?.nome ?? ''}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      (produto?.quantidade ?? 0) <= (produto?.quantidade_minima ?? 0) 
                        ? 'bg-amber-100/60 text-amber-700' 
                        : 'bg-emerald-100/60 text-emerald-700'
                    }`}>
                        {(produto?.quantidade ?? 0) <= (produto?.quantidade_minima ?? 0) ? 'Repor' : 'Ok'}
                    </span>
                    <button 
                      onClick={() => setProdutoParaExcluir(produto)}
                      title="Excluir produto"
                      aria-label={`Excluir ${produto.nome}`}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-aurora-text-muted)] mt-1.5">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">{produto?.categoria ?? 'Outro'}</span>
                  {produto?.ambiente_id && (
                    <span className="surface-primary-soft flex items-center gap-1 rounded-md px-2 py-0.5 font-medium">
                      {ambientes.find(a => a.id === produto.ambiente_id)?.icone ?? '🏠'} {ambientes.find(a => a.id === produto.ambiente_id)?.nome ?? 'Desconhecido'}
                    </span>
                  )}
                  {produto?.validade && (
                    <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${isVencido(produto.validade) ? 'bg-red-100 text-red-700' : isVencendo(produto.validade) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      <Clock size={12} /> {new Date(produto.validade).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {(produto?.preco ?? 0) > 0 && (
                    <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium flex items-center gap-1" title="Valor Unitário -> Total">
                      <DollarSign size={12} /> 
                      R$ {(produto!.preco!).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      <span className="opacity-50 mx-0.5">•</span> 
                      Total: R$ {((produto?.quantidade ?? 0) * (produto!.preco!)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <span className="rounded-xl bg-[var(--color-aurora-soft)] px-4 py-2 font-medium text-[var(--color-aurora-text)]">
                  {produto?.quantidade ?? 0} {produto?.quantidade === 1 ? 'unid' : 'unids'}
                </span>
                <div className="flex space-x-1.5 rounded-2xl bg-[var(--color-aurora-soft)] p-1.5">
                  <button 
                    onClick={() => alterarQuantidade(produto.id, -1)} 
                    disabled={(produto?.quantidade ?? 0) === 0}
                    aria-label={`Diminuir quantidade de ${produto.nome}`}
                    className="rounded-xl p-2.5 text-[var(--color-aurora-text-muted)] transition-[color,background-color,transform] hover:bg-[var(--color-aurora-surface)] hover:text-[var(--color-aurora-text)] active:scale-90 disabled:opacity-50 disabled:hover:bg-transparent disabled:active:scale-100"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => alterarQuantidade(produto.id, 1)} 
                    aria-label={`Aumentar quantidade de ${produto.nome}`}
                    className="rounded-xl p-2.5 text-[var(--color-aurora-text-muted)] transition-[color,background-color,transform] hover:bg-[var(--color-aurora-surface)] hover:text-[var(--color-aurora-text)] active:scale-90"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {produtoParaExcluir && (
        <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title">
          <div className="modal-panel max-w-sm p-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="status-danger rounded-xl p-3">
                <AlertTriangle size={32} />
              </div>
              <h3 id="delete-product-title" className="text-xl font-bold">Excluir produto</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tem certeza que deseja remover <strong className="text-slate-800 dark:text-slate-200">{produtoParaExcluir.nome}</strong> do inventário?
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setProdutoParaExcluir(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-200 dark:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmarExclusao}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Novo Item */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
          <div className="modal-panel max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 id="product-dialog-title" className="text-xl font-bold">Adicionar produto</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Fechar" className="icon-button bg-[var(--color-aurora-soft)]">
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProduto} className="space-y-4">
              <div>
                <label htmlFor="produto-nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do produto</label>
                <input id="produto-nome" name="nome" required type="text" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="form-input p-3" placeholder="Ex.: Café em pó…" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <div className="flex items-center space-x-2">
                    <select required value={novoProduto.categoria} onChange={e => setNovoProduto({...novoProduto, categoria: e.target.value})} className="form-input w-full flex-1 p-3">
                      {categoriasProduto.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setIsGestaoCategoriasModalOpen(true)} aria-label="Criar categoria" className="surface-primary-soft rounded-xl p-3 transition-colors hover:bg-[var(--color-aurora-soft)]" title="Nova categoria">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ambiente</label>
                  <div className="flex items-center space-x-2">
                    <select required value={novoProduto.ambiente_id} onChange={e => setNovoProduto({...novoProduto, ambiente_id: Number(e.target.value)})} className="form-input w-full flex-1 p-3">
                      {ambientes.map(amb => (
                        <option key={amb.id} value={amb.id}>{amb.nome} {amb.icone}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setIsGestaoAmbientesModalOpen(true)} aria-label="Criar ambiente" className="surface-primary-soft rounded-xl p-3 transition-colors hover:bg-[var(--color-aurora-soft)]" title="Novo ambiente">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="produto-quantidade" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade atual</label>
                  <input id="produto-quantidade" name="quantidade" required type="number" min="0" step="any" value={novoProduto.quantidade} onChange={e => setNovoProduto({...novoProduto, quantidade: Number(e.target.value)})} className="form-input p-3" />
                </div>
                <div>
                  <label htmlFor="produto-minimo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque mínimo</label>
                  <input id="produto-minimo" name="quantidade_minima" required type="number" min="0" step="any" value={novoProduto.quantidade_minima} onChange={e => setNovoProduto({...novoProduto, quantidade_minima: Number(e.target.value)})} className="form-input p-3" />
                </div>
              </div>

              <div>
                <label htmlFor="produto-validade" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Validade (opcional)</label>
                <input id="produto-validade" name="validade" type="date" value={novoProduto.validade} onChange={e => setNovoProduto({...novoProduto, validade: e.target.value})} className="form-input p-3" />
              </div>

              <button type="submit" className="btn-primary mt-2 w-full p-4">
                Adicionar ao inventário
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gestão de Ambientes */}
      <GestaoAmbientesModal 
        isOpen={isGestaoAmbientesModalOpen} 
        onClose={() => setIsGestaoAmbientesModalOpen(false)} 
      />

      {/* Modal Gestão de Categorias */}
      <GestaoCategoriasModal isOpen={isGestaoCategoriasModalOpen} onClose={() => setIsGestaoCategoriasModalOpen(false)} />
    </div>
  );
}
