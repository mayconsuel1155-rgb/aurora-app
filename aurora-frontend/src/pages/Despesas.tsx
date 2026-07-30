import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, X, Search, DollarSign, Wallet, TrendingDown, CheckCircle2, Circle, Calendar, Trash2 } from 'lucide-react';

export default function Despesas() {
  const { despesas, loading, fetchDespesas, adicionarDespesa, editarDespesa, removerDespesa } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    categoria: 'Conta de Luz',
    valor: 0,
    vencimento: '',
    pago: false
  });

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  const handleCreateDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    // Conversão de data se houver vencimento
    const dataObj = { ...novaDespesa, vencimento: novaDespesa.vencimento ? new Date(novaDespesa.vencimento).toISOString() : undefined };
    await adicionarDespesa(dataObj);
    setIsModalOpen(false);
    setNovaDespesa({
      descricao: '',
      categoria: 'Conta de Luz',
      valor: 0,
      vencimento: '',
      pago: false
    });
  };

  const safeDespesas = Array.isArray(despesas) ? despesas : [];
  
  const despesasFiltradas = safeDespesas.filter(d => {
    if (!d) return false;
    const descMatch = (d.descricao ?? '').toLowerCase().includes(busca.toLowerCase());
    const catMatch = (d.categoria ?? '').toLowerCase().includes(busca.toLowerCase());
    return descMatch || catMatch;
  });

  const despesasPagas = safeDespesas.filter(d => d.pago);
  const despesasPendentes = safeDespesas.filter(d => !d.pago);

  const totalPago = despesasPagas.reduce((acc, d) => acc + (d.valor ?? 0), 0);
  const totalPendente = despesasPendentes.reduce((acc, d) => acc + (d.valor ?? 0), 0);

  const handleTogglePago = async (id: number, atualPago: boolean) => {
    await editarDespesa(id, { pago: !atualPago });
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta despesa?")) {
      await removerDespesa(id);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sem vencimento';
    const d = new Date(dateStr);
    // Compensa fuso se necessario, mas usando toLocaleDateString é suficiente para exibição simples
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas da Casa</h1>
          <p className="text-[var(--color-aurora-text-muted)] mt-1 font-light">
            Controle de gastos essenciais, aluguel, luz e serviços.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-medium hover:bg-indigo-700 transition-smooth shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center"
        >
          <Plus size={18} strokeWidth={2} className="mr-2" /> Nova Despesa
        </button>
      </header>

      {/* Dashboard Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Pendentes */}
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingDown size={20} className="text-white" />
            </div>
            <h3 className="font-medium text-rose-50 tracking-wide text-sm uppercase">Total a Pagar</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold opacity-80">R$</span>
            <span className="text-5xl font-extrabold tracking-tight">{totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="mt-3 text-rose-100 text-sm opacity-90">
            {despesasPendentes.length} contas pendentes
          </p>
        </div>

        {/* Card Pagos */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Wallet size={20} className="text-emerald-500" />
            </div>
            <h3 className="font-medium text-slate-500 dark:text-slate-400 tracking-wide text-sm uppercase">Total Pago</h3>
          </div>
          <div className="flex items-baseline space-x-2 text-slate-800 dark:text-slate-100">
            <span className="text-2xl font-semibold opacity-60">R$</span>
            <span className="text-5xl font-extrabold tracking-tight">{totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">
            {despesasPagas.length} contas já quitadas
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar despesa por nome ou categoria..."
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/40 transition-all text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
           {[1, 2, 3].map(i => (
             <div key={i} className="aurora-card h-24 animate-pulse bg-slate-200 dark:bg-slate-700/40"></div>
           ))}
        </div>
      ) : despesasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 aurora-card border-dashed">
           <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4 text-slate-400">
              <DollarSign size={48} strokeWidth={1} />
           </div>
           <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200 mb-2">Nenhuma despesa encontrada</h3>
           <p className="text-slate-500 text-center max-w-sm">
             Adicione as contas da casa para manter seu controle financeiro sempre em dia.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {despesasFiltradas.sort((a, b) => {
            // Pendentes primeiro, depois por vencimento
            if (a.pago !== b.pago) return a.pago ? 1 : -1;
            if (!a.vencimento) return 1;
            if (!b.vencimento) return -1;
            return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
          }).map(despesa => (
            <div key={despesa.id} className={`aurora-card p-5 flex items-center justify-between hover:translate-y-[-2px] transition-smooth border-l-4 ${despesa.pago ? 'border-l-emerald-500 opacity-75' : 'border-l-rose-500'}`}>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handleTogglePago(despesa.id, despesa.pago)}
                  className={`p-1 rounded-full transition-colors ${despesa.pago ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500'}`}
                >
                  {despesa.pago ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </button>
                <div>
                  <h3 className={`font-semibold text-lg text-slate-800 dark:text-slate-200 ${despesa.pago ? 'line-through decoration-slate-400/50' : ''}`}>{despesa.descricao}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">{despesa.categoria}</span>
                    {despesa.vencimento && (
                      <span className={`flex items-center gap-1 ${!despesa.pago && new Date(despesa.vencimento) < new Date() ? 'text-rose-500 font-bold' : ''}`}>
                        <Calendar size={12} /> Venc: {formatDate(despesa.vencimento)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`font-bold text-xl ${despesa.pago ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  R$ {(despesa.valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button 
                  onClick={() => handleExcluir(despesa.id)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                  title="Excluir despesa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Despesa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Lançar Despesa</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDespesa} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                <input required autoFocus type="text" value={novaDespesa.descricao} onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 bg-white dark:bg-slate-900" placeholder="Ex: Conta da Copel (Luz)" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Serviço)</label>
                  <input required type="text" value={novaDespesa.categoria} onChange={e => setNovaDespesa({...novaDespesa, categoria: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 bg-white dark:bg-slate-900" placeholder="Ex: Energia, Água..." list="catList" />
                  <datalist id="catList">
                    <option value="Aluguel" />
                    <option value="Energia Elétrica" />
                    <option value="Água e Esgoto" />
                    <option value="Internet" />
                    <option value="Condomínio" />
                    <option value="Manutenção" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input required type="number" min="0" step="0.01" value={novaDespesa.valor || ''} onChange={e => setNovaDespesa({...novaDespesa, valor: parseFloat(e.target.value)})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 bg-white dark:bg-slate-900" placeholder="0,00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento (Opcional)</label>
                <input type="date" value={novaDespesa.vencimento} onChange={e => setNovaDespesa({...novaDespesa, vencimento: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 bg-white dark:bg-slate-900" />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="pagoBox" checked={novaDespesa.pago} onChange={e => setNovaDespesa({...novaDespesa, pago: e.target.checked})} className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600" />
                <label htmlFor="pagoBox" className="text-sm font-medium text-slate-700 dark:text-slate-300">Marcar como já paga</label>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl font-medium mt-4 hover:bg-indigo-700 transition-smooth active:scale-95 shadow-md">
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
