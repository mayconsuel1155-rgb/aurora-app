import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus, PackageOpen, X, Search, MapPin, Tag, Trash2, AlertTriangle, Settings2, Clock } from 'lucide-react';
import { GestaoAmbientesModal } from '../components/GestaoAmbientesModal';
import type { Produto } from '../api/client';

const CATEGORIAS = ['Todas', 'Alimentos', 'Limpeza', 'Higiene', 'Outros'];

export default function Estoque() {
  const { produtos, ambientes, loading, fetchProdutos, fetchAmbientes, alterarQuantidade, adicionarProduto, removerProduto } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGestaoAmbientesModalOpen, setIsGestaoAmbientesModalOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [busca, setBusca] = useState('');
  const [ambienteFiltroId, setAmbienteFiltroId] = useState<number | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    categoria: 'Alimentos',
    ambiente_id: 0,
    quantidade: 1,
    quantidade_minima: 1,
    validade: ''
  });

  useEffect(() => {
    fetchProdutos();
    fetchAmbientes();
  }, [fetchProdutos, fetchAmbientes]);

  useEffect(() => {
    if (ambientes.length > 0 && novoProduto.ambiente_id === 0) {
      setNovoProduto(prev => ({ ...prev, ambiente_id: ambientes[0].id }));
    }
  }, [ambientes]);

  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    await adicionarProduto(novoProduto);
    setIsModalOpen(false);
    setNovoProduto({
      nome: '',
      categoria: 'Alimentos',
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário da Casa</h1>
          <p className="text-[var(--color-aurora-text-muted)] mt-1 font-light">
            Organizado por ambientes e categorias da sua residência.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-aurora-primary)] text-white px-5 py-3 rounded-2xl font-medium hover:bg-[var(--color-aurora-primary-hover)] transition-smooth shadow-lg shadow-[var(--color-aurora-primary)]/20 active:scale-95 flex items-center"
        >
          <Plus size={18} strokeWidth={2} className="mr-2" /> Novo Item
        </button>
      </header>

      {/* Controles de Busca e Filtros */}
      <div className="space-y-4">
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto por nome ou categoria..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all text-slate-800 placeholder-slate-400"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros por Ambiente */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-[var(--color-aurora-text-muted)] tracking-wider">
              <MapPin size={14} />
              <span>Filtrar por Ambiente:</span>
            </div>
            <button 
              onClick={() => setIsGestaoAmbientesModalOpen(true)}
              className="flex items-center space-x-1 text-xs font-medium text-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary-hover)] transition-colors"
            >
              <Settings2 size={14} />
              <span>Gerenciar Ambientes</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAmbienteFiltroId(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                ambienteFiltroId === null
                  ? 'bg-[var(--color-aurora-primary)] text-white shadow-md shadow-[var(--color-aurora-primary)]/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {ambientes.map(amb => (
              <button
                key={amb.id}
                onClick={() => setAmbienteFiltroId(amb.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  ambienteFiltroId === amb.id
                    ? 'bg-[var(--color-aurora-primary)] text-white shadow-md shadow-[var(--color-aurora-primary)]/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {amb.icone} {amb.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros por Categoria */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-[var(--color-aurora-text-muted)] tracking-wider">
            <Tag size={14} />
            <span>Filtrar por Categoria:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  categoriaFiltro === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
           {[1, 2, 3].map(i => (
             <div key={i} className="aurora-card h-48 animate-pulse bg-slate-200/40"></div>
           ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 aurora-card border-dashed">
           <div className="p-6 bg-slate-100/50 rounded-full mb-4 text-[var(--color-aurora-text-muted)]">
              <PackageOpen size={48} strokeWidth={1} />
           </div>
           <h3 className="text-xl font-medium text-[var(--color-aurora-text)] mb-2">Nenhum produto encontrado</h3>
           <p className="text-[var(--color-aurora-text-muted)] text-center max-w-sm">
             {safeProdutos.length === 0
               ? 'Sua casa ainda não possui produtos mapeados. Adicione o primeiro item para começar.'
               : 'Nenhum item corresponde aos filtros selecionados. Tente limpar os filtros de busca.'}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {produtosFiltrados.map(produto => (
            <div key={produto?.id} className="aurora-card p-6 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-xl transition-smooth relative group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg leading-tight text-[var(--color-aurora-text)] pr-2">{produto?.nome ?? ''}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold backdrop-blur-sm ${
                      (produto?.quantidade ?? 0) <= (produto?.quantidade_minima ?? 0) 
                        ? 'bg-amber-100/60 text-amber-700' 
                        : 'bg-emerald-100/60 text-emerald-700'
                    }`}>
                        {(produto?.quantidade ?? 0) <= (produto?.quantidade_minima ?? 0) ? 'Repor' : 'Ok'}
                    </span>
                    <button 
                      onClick={() => setProdutoParaExcluir(produto)}
                      title="Excluir produto"
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-[var(--color-aurora-text-muted)] mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">{produto?.categoria ?? 'Outro'}</span>
                  {produto?.ambiente_id && (
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                      {ambientes.find(a => a.id === produto.ambiente_id)?.icone ?? '🏠'} {ambientes.find(a => a.id === produto.ambiente_id)?.nome ?? 'Desconhecido'}
                    </span>
                  )}
                  {produto?.validade && (
                    <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${isVencido(produto.validade) ? 'bg-red-100 text-red-700' : isVencendo(produto.validade) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Clock size={12} /> {new Date(produto.validade).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[var(--color-aurora-text)] font-medium bg-slate-100/50 px-4 py-2 rounded-xl backdrop-blur-md">
                  {produto?.quantidade ?? 0} {produto?.quantidade === 1 ? 'unid' : 'unids'}
                </span>
                <div className="flex space-x-1.5 bg-slate-100/50 p-1.5 rounded-2xl backdrop-blur-md">
                  <button 
                    onClick={() => alterarQuantidade(produto.id, -1)} 
                    disabled={(produto?.quantidade ?? 0) === 0}
                    className="p-2.5 text-[var(--color-aurora-text-muted)] hover:bg-white hover:text-[var(--color-aurora-text)] hover:shadow-sm rounded-xl transition-all active:scale-90 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:active:scale-100"
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => alterarQuantidade(produto.id, 1)} 
                    className="p-2.5 text-[var(--color-aurora-text-muted)] hover:bg-white hover:text-[var(--color-aurora-text)] hover:shadow-sm rounded-xl transition-all active:scale-90"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Excluir Produto</h3>
              <p className="text-sm text-slate-500">
                Tem certeza que deseja remover <strong className="text-slate-800">{produtoParaExcluir.nome}</strong> do inventário?
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setProdutoParaExcluir(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Novo Item do Inventário</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProduto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                <input required autoFocus type="text" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50" placeholder="Ex: Café em pó" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select required value={novoProduto.categoria} onChange={e => setNovoProduto({...novoProduto, categoria: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50 bg-white">
                    <option value="Alimentos">Alimentos</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ambiente</label>
                  <select required value={novoProduto.ambiente_id} onChange={e => setNovoProduto({...novoProduto, ambiente_id: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50 bg-white">
                    {ambientes.map(amb => (
                      <option key={amb.id} value={amb.id}>{amb.nome} {amb.icone}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qtd Atual</label>
                  <input required type="number" min="0" step="any" value={novoProduto.quantidade} onChange={e => setNovoProduto({...novoProduto, quantidade: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input required type="number" min="0" step="any" value={novoProduto.quantidade_minima} onChange={e => setNovoProduto({...novoProduto, quantidade_minima: Number(e.target.value)})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Validade (Opcional)</label>
                <input type="date" value={novoProduto.validade} onChange={e => setNovoProduto({...novoProduto, validade: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/50 bg-white" />
              </div>

              <button type="submit" className="w-full bg-[var(--color-aurora-primary)] text-white p-4 rounded-xl font-medium mt-2 hover:bg-[var(--color-aurora-primary-hover)] transition-smooth active:scale-95 shadow-md">
                Adicionar ao Inventário
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
    </div>
  );
}
