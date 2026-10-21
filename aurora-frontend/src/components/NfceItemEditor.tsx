import type { CategoriaProduto, Produto } from '../api/client';
import type { NfceReviewItem } from '../types/nfce';

interface NfceItemEditorProps {
  item: NfceReviewItem;
  products: Produto[];
  categories: CategoriaProduto[];
  onChange: (changes: Partial<NfceReviewItem>) => void;
}

const COMMON_UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pacote'];

export default function NfceItemEditor({ item, products, categories, onChange }: NfceItemEditorProps) {
  const units = COMMON_UNITS.includes(item.unidade) ? COMMON_UNITS : [item.unidade, ...COMMON_UNITS];

  return (
    <article className={`rounded-2xl border p-4 transition-opacity ${item.selecionado ? 'border-[var(--color-aurora-border)]' : 'border-transparent bg-[var(--color-aurora-soft)] opacity-60'}`}>
      <div className="mb-4 flex items-start gap-3">
        <input
          id={`nfce-selected-${item.indice}`}
          name={`nfce-selected-${item.indice}`}
          type="checkbox"
          checked={item.selecionado}
          onChange={event => onChange({ selecionado: event.target.checked })}
          aria-label={`Importar ${item.nome}`}
          className="mt-1 h-5 w-5 accent-[var(--color-aurora-primary)]"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`nfce-name-${item.indice}`} className="sr-only">Nome do produto</label>
          <input
            id={`nfce-name-${item.indice}`}
            value={item.nome}
            disabled={!item.selecionado}
            onChange={event => onChange({ nome: event.target.value })}
            className="form-input w-full px-3 py-2 font-semibold"
          />
          <p className="mt-1 text-xs text-[var(--color-aurora-text-muted)]">
            Total na nota: R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor={`nfce-quantity-${item.indice}`} className="text-xs font-medium">Quantidade</label>
          <input
            id={`nfce-quantity-${item.indice}`}
            type="number"
            min="0.001"
            step="any"
            value={item.quantidade}
            disabled={!item.selecionado}
            onChange={event => onChange({ quantidade: Number(event.target.value) })}
            className="form-input mt-1 w-full px-2 py-2"
          />
        </div>
        <div>
          <label htmlFor={`nfce-unit-${item.indice}`} className="text-xs font-medium">Unidade</label>
          <select
            id={`nfce-unit-${item.indice}`}
            value={item.unidade}
            disabled={!item.selecionado}
            onChange={event => onChange({ unidade: event.target.value })}
            className="form-input mt-1 w-full px-2 py-2"
          >
            {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`nfce-price-${item.indice}`} className="text-xs font-medium">Preço unitário</label>
          <input
            id={`nfce-price-${item.indice}`}
            type="number"
            min="0"
            step="0.01"
            value={item.preco_unitario}
            disabled={!item.selecionado}
            onChange={event => onChange({ preco_unitario: Number(event.target.value) })}
            className="form-input mt-1 w-full px-2 py-2"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`nfce-product-${item.indice}`} className="text-xs font-medium">Destino no estoque</label>
          <select
            id={`nfce-product-${item.indice}`}
            value={item.produto_id ?? ''}
            disabled={!item.selecionado}
            onChange={event => onChange({ produto_id: event.target.value ? Number(event.target.value) : undefined })}
            className="form-input mt-1 w-full px-2 py-2"
          >
            <option value="">Criar como produto novo</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.nome} ({product.unidade || 'un'})</option>
            ))}
          </select>
        </div>
        {!item.produto_id && (
          <div>
            <label htmlFor={`nfce-category-${item.indice}`} className="text-xs font-medium">Categoria</label>
            <select
              id={`nfce-category-${item.indice}`}
              value={item.categoria}
              disabled={!item.selecionado}
              onChange={event => onChange({ categoria: event.target.value })}
              className="form-input mt-1 w-full px-2 py-2"
            >
              <option value="Outros">Outros</option>
              {categories.filter(category => category.nome !== 'Outros').map(category => (
                <option key={category.id} value={category.nome}>{category.nome}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </article>
  );
}
