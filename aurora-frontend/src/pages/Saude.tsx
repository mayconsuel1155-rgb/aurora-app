import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Clock, Plus, Trash2, Power, PowerOff } from 'lucide-react';

export default function Saude() {
  const remedios = useStore(state => state.remedios);
  const adicionarRemedio = useStore(state => state.adicionarRemedio);
  const toggleRemedio = useStore(state => state.toggleRemedio);
  const removerRemedio = useStore(state => state.removerRemedio);
  const fetchRemedios = useStore(state => state.fetchRemedios);
  
  const [nome, setNome] = useState('');
  const [horarios, setHorarios] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRemedios();
  }, [fetchRemedios]);

  // Formata o input de horários. Ex: o usuário digita "0800" vira "08:00". "0800,2000" vira "08:00, 20:00"
  // Para simplificar na UI vamos usar um placeholder claro.
  
  const handleAddRemedio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !horarios.trim()) return;
    
    // Limpar os horários (garantir formato HH:MM separados por virgula)
    const horariosLimpos = horarios.split(',')
      .map(h => h.trim())
      .filter(h => h.match(/^([01]\d|2[0-3]):?([0-5]\d)$/))
      .map(h => h.replace(/^(\d{2})(\d{2})$/, "$1:$2"))
      .join(', ');
      
    if (!horariosLimpos) {
      alert("Por favor, insira horários válidos no formato HH:MM (ex: 08:00, 20:00)");
      return;
    }

    setLoading(true);
    try {
      await adicionarRemedio({
        nome: nome.trim(),
        horarios: horariosLimpos,
      });
      setNome('');
      setHorarios('');
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar remédio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <Activity className="text-rose-500" size={32} />
          Saúde e medicamentos
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Organize os horários dos medicamentos e mantenha os lembretes em dia.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Esquerdo: Formulário */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Adicionar medicamento</h2>
            <form onSubmit={handleAddRemedio} className="space-y-4">
              <div>
                <label htmlFor="medicamento-nome" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do medicamento</label>
                <input
                  id="medicamento-nome"
                  name="nome"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="form-input p-3"
                  placeholder="Ex.: Losartana 50 mg"
                  required
                />
              </div>
              <div>
                <label htmlFor="medicamento-horarios" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horários</label>
                <input
                  id="medicamento-horarios"
                  name="horarios"
                  type="text"
                  value={horarios}
                  onChange={e => setHorarios(e.target.value)}
                  className="form-input p-3"
                  placeholder="Ex.: 08:00, 20:00"
                  required
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Separe múltiplos horários por vírgula.</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-6 flex w-full items-center justify-center gap-2 p-3"
              >
                {loading ? 'Adicionando…' : <><Plus size={20} /> Cadastrar medicamento</>}
              </button>
            </form>
          </div>
        </div>

        {/* Painel Direito: Lista de Remédios */}
        <div className="lg:col-span-2">
          {remedios.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/30 rounded-3xl p-12 border border-dashed border-slate-200 dark:border-slate-700 h-full text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                <Activity size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhum medicamento cadastrado</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Adicione um medicamento para organizar os horários e receber lembretes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remedios.map(remedio => (
                <div 
                  key={remedio.id} 
                  className={`group relative overflow-hidden rounded-2xl border bg-[var(--color-aurora-surface)] p-5 transition-[border-color,box-shadow,opacity] ${remedio.ativo ? 'border-[var(--color-aurora-border)] shadow-sm hover:shadow-md' : 'border-[var(--color-aurora-border)] opacity-70'}`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${remedio.ativo ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className={`font-bold text-lg ${remedio.ativo ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 line-through'}`}>
                        {remedio.nome}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {remedio.horarios.split(',').map((h, i) => (
                          <span key={i} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${remedio.ativo ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            <Clock size={12} /> {h.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => toggleRemedio(remedio.id)}
                        className={`p-2 rounded-xl transition-colors ${remedio.ativo ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        title={remedio.ativo ? "Pausar Alarme" : "Ativar Alarme"}
                      >
                        {remedio.ativo ? <Power size={18} /> : <PowerOff size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm("Deseja mesmo excluir este remédio?")) {
                            removerRemedio(remedio.id);
                          }
                        }}
                        className="rounded-xl bg-red-50 p-2 text-red-600 opacity-0 transition-[background-color,opacity] hover:bg-red-100 group-hover:opacity-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        title="Excluir Medicamento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
