import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Tag, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GestaoCategoriasModal({ isOpen, onClose }: Props) {
  const { categoriasProduto, adicionarCategoriaProduto, removerCategoriaProduto } = useStore();
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<{ id: number; nome: string } | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    await adicionarCategoriaProduto({ nome: novaCategoria.trim() });
    setNovaCategoria('');
  };

  const handleRemove = async () => {
    if (!categoriaParaExcluir) return;
    await removerCategoriaProduto(categoriaParaExcluir.id);
    setCategoriaParaExcluir(null);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="categories-title" className="modal-backdrop">
      <div className="modal-panel max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 text-[var(--color-aurora-text)]">
            <Tag aria-hidden="true" size={24} className="text-[var(--color-aurora-primary)]" />
            <h2 id="categories-title" className="text-xl font-bold">Gerenciar categorias</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar categorias" className="icon-button bg-[var(--color-aurora-soft)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Add Form */}
          <form onSubmit={handleAdd} className="flex space-x-2">
            <input 
              id="nova-categoria"
              name="categoria"
              aria-label="Nome da nova categoria"
              type="text"
              required
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              autoComplete="off"
              placeholder="Ex.: Frios e laticínios"
              className="form-input min-w-0 flex-1 text-sm"
            />
            <button 
              type="submit"
              disabled={!novaCategoria.trim()}
              aria-label="Adicionar categoria"
              className="rounded-xl bg-[var(--color-aurora-primary)] p-3 text-white shadow-md transition-colors hover:bg-[var(--color-aurora-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
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
                  onClick={() => setCategoriaParaExcluir({ id: cat.id, nome: cat.nome })}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  aria-label={`Excluir categoria ${cat.nome}`}
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

      <ConfirmDialog
        isOpen={Boolean(categoriaParaExcluir)}
        title="Excluir categoria"
        description={`A categoria ${categoriaParaExcluir?.nome ?? ''} será removida. Os produtos existentes não serão apagados.`}
        onConfirm={handleRemove}
        onCancel={() => setCategoriaParaExcluir(null)}
      />
    </div>
  );
}
