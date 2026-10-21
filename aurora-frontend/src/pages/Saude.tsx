import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Clock, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Saude() {
  const remedios = useStore(state => state.remedios);
  const adicionarRemedio = useStore(state => state.adicionarRemedio);
  const toggleRemedio = useStore(state => state.toggleRemedio);
  const removerRemedio = useStore(state => state.removerRemedio);
  const fetchRemedios = useStore(state => state.fetchRemedios);
  
  const [nome, setNome] = useState('');
  const [horarios, setHorarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [remedioParaExcluir, setRemedioParaExcluir] = useState<{ id: number; nome: string } | null>(null);

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
      setFormError('Use horários válidos no formato HH:MM, como 08:00 ou 20:00.');
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      await adicionarRemedio({
        nome: nome.trim(),
        horarios: horariosLimpos,
      });
      setNome('');
      setHorarios('');
    } catch (error) {
      console.error(error);
      setFormError('Não foi possível adicionar o medicamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cuidados"
        title="Saúde e medicamentos"
        description="Organize os horários dos medicamentos e mantenha os lembretes da família em dia."
      />

      {formError && <div role="alert" className="status-danger rounded-xl border border-current/15 p-4 text-sm font-medium">{formError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Esquerdo: Formulário */}
        <div className="lg:col-span-1 space-y-6">
          <div className="aurora-panel p-6">
            <h2 className="section-title mb-6">Adicionar medicamento</h2>
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
            <div className="empty-state h-full">
              <div className="empty-state-icon mb-4">
                <Activity aria-hidden="true" size={24} />
              </div>
              <h3 className="section-title">Nenhum medicamento cadastrado</h3>
              <p className="section-copy max-w-md">
                Adicione um medicamento para organizar os horários e receber lembretes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remedios.map(remedio => (
                <div 
                  key={remedio.id} 
                  className={`aurora-panel render-item group relative p-5 transition-[border-color,box-shadow,opacity] ${remedio.ativo ? 'hover:shadow-[var(--shadow-float)]' : 'opacity-70'}`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${remedio.ativo ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className={`font-bold text-lg ${remedio.ativo ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 line-through'}`}>
                        {remedio.nome}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {remedio.horarios.split(',').map((h, i) => (
                          <span key={i} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${remedio.ativo ? 'status-danger' : 'bg-[var(--color-aurora-soft)] text-[var(--color-aurora-text-muted)]'}`}>
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
                        aria-label={remedio.ativo ? `Pausar alertas de ${remedio.nome}` : `Ativar alertas de ${remedio.nome}`}
                      >
                        {remedio.ativo ? <Power size={18} /> : <PowerOff size={18} />}
                      </button>
                      <button 
                        onClick={() => setRemedioParaExcluir({ id: remedio.id, nome: remedio.nome })}
                        className="rounded-xl bg-red-50 p-2 text-red-600 opacity-100 transition-[background-color,opacity] hover:bg-red-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        title="Excluir Medicamento"
                        aria-label={`Excluir ${remedio.nome}`}
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

      <ConfirmDialog
        isOpen={Boolean(remedioParaExcluir)}
        title="Excluir medicamento"
        description={`${remedioParaExcluir?.nome ?? 'Este medicamento'} e seus horários serão removidos.`}
        onConfirm={async () => {
          if (!remedioParaExcluir) return;
          await removerRemedio(remedioParaExcluir.id);
          setRemedioParaExcluir(null);
        }}
        onCancel={() => setRemedioParaExcluir(null)}
      />
    </div>
  );
}
