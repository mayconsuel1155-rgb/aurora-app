import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Tag, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GestaoCategoriasModal({ isOpen, onClose }: Props) {
  const { categoriasProduto, adicionarCategoriaProduto, removerCategoriaProduto } = useStore();
  const [novaCategoria, setNovaCategoria] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    await adicionarCategoriaProduto({ nome: novaCategoria.trim() });
    setNovaCategoria('');
  };

  const handleRemove = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta categoria?")) {
      await removerCategoriaProduto(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 text-[var(--color-aurora-text)]">
            <Tag size={24} className="text-indigo-500" />
            <h2 className="text-xl font-bold">Gerenciar Categorias</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="flex space-x-2">
            <input 
              type="text"
              required
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              placeholder="Ex: Frios e Laticínios"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button 
              type="submit"
              disabled={!novaCategoria.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-600/20"
            >
              <Plus size={20} />
            </button>
          </form>

          {/* List */}
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {categoriasProduto.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">{cat.nome}</span>
                <button
                  onClick={() => handleRemove(cat.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title="Excluir categoria"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {categoriasProduto.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">
                Nenhuma categoria cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
