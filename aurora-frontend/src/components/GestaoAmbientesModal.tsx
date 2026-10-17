import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Trash2, MapPin, AlertTriangle } from 'lucide-react';

interface GestaoAmbientesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONES_DISPONIVEIS = ['🏠', '🧊', '📦', '🧺', '🧼', '🍽️', '🛏️', '🚗', '🪴', '🛠️'];

export function GestaoAmbientesModal({ isOpen, onClose }: GestaoAmbientesModalProps) {
  const { ambientes, adicionarAmbiente, removerAmbiente } = useStore();
  const [novoNome, setNovoNome] = useState('');
  const [novoIcone, setNovoIcone] = useState('🏠');
  const [ambienteParaExcluir, setAmbienteParaExcluir] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    
    await adicionarAmbiente({
      nome: novoNome.trim(),
      icone: novoIcone
    });
    
    setNovoNome('');
    setNovoIcone('🏠');
  };

  const handleConfirmarExclusao = async () => {
    if (ambienteParaExcluir !== null) {
      await removerAmbiente(ambienteParaExcluir);
      setAmbienteParaExcluir(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101713]/55 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[var(--color-aurora-primary)]/10 text-[var(--color-aurora-primary)] rounded-xl">
              <MapPin size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Gerenciar Ambientes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Adicionar Novo Ambiente */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6 shrink-0 border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">Criar Novo</h3>
          <form onSubmit={handleCriar} className="flex flex-col space-y-3">
            <div className="flex space-x-3">
              <div className="relative">
                <select 
                  value={novoIcone} 
                  onChange={(e) => setNovoIcone(e.target.value)}
                  className="form-input h-12 w-14 cursor-pointer appearance-none text-center text-xl"
                >
                  {ICONES_DISPONIVEIS.map(icone => (
                    <option key={icone} value={icone}>{icone}</option>
                  ))}
                </select>
              </div>
              <input
                id="novo-ambiente"
                name="ambiente"
                aria-label="Nome do novo ambiente"
                type="text"
                placeholder="Ex.: Fruteira, armário…"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="form-input min-w-0 flex-1 px-4"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={!novoNome.trim()}
              className="btn-primary flex items-center justify-center gap-2 p-3 active:scale-95"
            >
              <Plus size={18} /> Adicionar Ambiente
            </button>
          </form>
        </div>

        {/* Lista de Ambientes Existentes */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-800 py-2">Seus Ambientes ({ambientes.length})</h3>
          
          {ambientes.length === 0 ? (
             <div className="text-center p-6 text-slate-400 text-sm">
                Nenhum ambiente criado ainda.
             </div>
          ) : (
            <div className="space-y-2 pb-2">
              {ambientes.map(amb => (
                <div key={amb.id} className="group flex items-center justify-between rounded-2xl border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-3.5 transition-[border-color,box-shadow] hover:shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl bg-slate-50 dark:bg-slate-900/50 w-10 h-10 flex items-center justify-center rounded-xl">{amb.icone}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{amb.nome}</span>
                  </div>
                  <button 
                    onClick={() => setAmbienteParaExcluir(amb.id)}
                    className="rounded-xl p-2 text-slate-300 opacity-100 transition-[color,background-color,opacity] hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 md:opacity-0"
                    title="Excluir ambiente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Confirmação de Exclusão Aninhado */}
      {ambienteParaExcluir !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#101713]/68 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Excluir Ambiente</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tem certeza? Os produtos que estão neste ambiente ficarão "Sem ambiente", mas <strong className="text-slate-800 dark:text-slate-200">não serão excluídos</strong>.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setAmbienteParaExcluir(null)}
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
    </div>
  );
}
