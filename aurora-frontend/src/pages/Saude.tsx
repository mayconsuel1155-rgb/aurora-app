import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Clock, Plus, Trash2, Power, PowerOff } from 'lucide-react';

export default function Saude() {
  const remedios = useStore(state => state.remedios);
  const adicionarRemedio = useStore(state => state.adicionarRemedio);
  const toggleRemedio = useStore(state => state.toggleRemedio);
  const removerRemedio = useStore(state => state.removerRemedio);
  
  const [nome, setNome] = useState('');
  const [horarios, setHorarios] = useState('');
  const [loading, setLoading] = useState(false);

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
          Saúde & Remédios
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
          Gerencie seus medicamentos e receba alertas exatos na hora de tomar.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Esquerdo: Formulário */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Novo Remédio</h2>
            <form onSubmit={handleAddRemedio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Medicamento</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-slate-200"
                  placeholder="Ex: Losartana 50mg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horários</label>
                <input
                  type="text"
                  value={horarios}
                  onChange={e => setHorarios(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-slate-200"
                  placeholder="Ex: 08:00, 20:00"
                  required
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Separe múltiplos horários por vírgula.</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl font-semibold transition-all shadow-sm shadow-rose-500/20 disabled:opacity-70 mt-6"
              >
                {loading ? 'Adicionando...' : <><Plus size={20} /> Cadastrar Medicamento</>}
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
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Nenhum remédio cadastrado</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Você ainda não tem medicamentos ativos. Cadastre ao lado para a Aurora começar a cuidar dos seus horários.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remedios.map(remedio => (
                <div 
                  key={remedio.id} 
                  className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border ${remedio.ativo ? 'border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md' : 'border-slate-100 dark:border-slate-700/50 opacity-70'} transition-all p-5 group`}
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
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100 transition-all"
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
