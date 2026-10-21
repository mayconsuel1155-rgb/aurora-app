import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Keyboard, LoaderCircle, QrCode, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNfceImport } from '../hooks/useNfceImport';
import NfceItemEditor from './NfceItemEditor';
import NfceScanner from './NfceScanner';

interface NfceImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function NfceImportDialog({ isOpen, onClose }: NfceImportDialogProps) {
  const { produtos, categoriasProduto, fetchProdutos, fetchInsight } = useStore();
  const {
    preview,
    keyResult,
    items,
    result,
    error,
    isLoading,
    isImporting,
    rateLimit,
    remainingSeconds,
    loadPreview,
    retryPreview,
    confirmImport,
    updateItem,
    reset,
  } = useNfceImport();
  const [isScanning, setIsScanning] = useState(false);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isImporting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isImporting, onClose]);

  if (!isOpen) return null;

  const handleDetected = (value: string) => {
    setIsScanning(false);
    void loadPreview(value);
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (manualValue.trim()) void loadPreview(manualValue.trim());
  };

  const handleImport = async () => {
    const imported = await confirmImport();
    if (!imported) return;
    await Promise.all([fetchProdutos(), fetchInsight()]);
  };

  const selectedCount = items.filter(item => item.selecionado).length;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="nfce-dialog-title">
      <div className="modal-panel max-h-[92dvh] max-w-3xl overflow-y-auto p-5 md:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Entrada rápida</p>
            <h2 id="nfce-dialog-title" className="section-title mt-1">Importar nota fiscal</h2>
            <p className="section-copy mt-2">Confira os dados antes de atualizar o estoque da casa.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isImporting} aria-label="Fechar importação" className="icon-button">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <LoaderCircle size={32} className="animate-spin text-[var(--color-aurora-primary)]" aria-hidden="true" />
            <h3 className="mt-4 font-semibold">Consultando a SEFAZ…</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-aurora-text-muted)]">Isso pode levar alguns segundos, dependendo do portal estadual.</p>
          </div>
        ) : result ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-[var(--color-aurora-success)]" aria-hidden="true" />
            <h3 className="section-title mt-4">Estoque atualizado</h3>
            <p className="section-copy mt-2">{result.atualizados} {result.atualizados === 1 ? 'produto atualizado' : 'produtos atualizados'} e {result.criados} {result.criados === 1 ? 'produto criado' : 'produtos criados'}.</p>
            <button type="button" onClick={onClose} className="btn-primary mt-6 px-6 py-3">Concluir</button>
          </div>
        ) : keyResult ? (
          <div>
            <div className={`rounded-2xl border p-5 ${keyResult.importada ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
              <div className="flex items-start gap-3">
                {keyResult.importada
                  ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" size={22} aria-hidden="true" />
                  : <Clock3 className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" size={22} aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">
                    {keyResult.importada ? 'Nota já importada' : `Chave válida · NFC-e ${keyResult.uf}`}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-aurora-text-muted)]">{keyResult.mensagem}</p>
                  <p className="mt-2 text-xs text-[var(--color-aurora-text-muted)]">
                    Chave terminada em {keyResult.chave_acesso.slice(-8)}
                    {keyResult.importada_em && ` · Importada em ${new Date(keyResult.importada_em).toLocaleString('pt-BR')}`}
                  </p>
                </div>
              </div>
            </div>

            {keyResult.importada && (
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="font-semibold">{keyResult.emitente || 'Nota fiscal importada'}</p>
                    <p className="text-sm text-[var(--color-aurora-text-muted)]">{keyResult.itens.length} {keyResult.itens.length === 1 ? 'item registrado' : 'itens registrados'}</p>
                  </div>
                  {keyResult.valor_total != null && (
                    <p className="font-semibold tabular-nums">R$ {keyResult.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  )}
                </div>
                {keyResult.itens.length ? (
                  <div className="space-y-2">
                    {keyResult.itens.map(item => (
                      <div key={item.indice} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-aurora-border)] p-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.nome}</p>
                          <p className="text-xs text-[var(--color-aurora-text-muted)]">
                            {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                            {item.importado_estoque ? ' · Adicionado ao estoque' : ' · Não selecionado'}
                          </p>
                        </div>
                        <span className="shrink-0 tabular-nums">R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[var(--color-aurora-soft)] p-4 text-sm text-[var(--color-aurora-text-muted)]">
                    Esta nota foi importada antes da criação do histórico detalhado.
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={reset} className="btn-outline px-5 py-3">Pesquisar outra</button>
              {!keyResult.importada && (
                <button
                  type="button"
                  onClick={() => { reset(); setIsScanning(true); }}
                  className="btn-primary flex items-center justify-center gap-2 px-5 py-3"
                >
                  <QrCode size={18} aria-hidden="true" /> Escanear QR Code
                </button>
              )}
            </div>
          </div>
        ) : preview ? (
          <div>
            <div className="mb-5 rounded-2xl bg-[var(--color-aurora-soft)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{preview.emitente || `NFC-e de ${preview.uf}`}</p>
                  <p className="mt-1 text-xs text-[var(--color-aurora-text-muted)]">Chave terminada em {preview.chave_acesso.slice(-8)}</p>
                </div>
                <p className="font-semibold tabular-nums">R$ {(preview.valor_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-100" role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                <div>
                  <p className="font-semibold">Controle de consultas · {preview.consulta_portal}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                    <span>Tentativas: {preview.consulta_tentativas}</span>
                    <span className="tabular-nums">Espera: {formatCountdown(preview.retry_after_seconds)}</span>
                    <span>Nova consulta liberada</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <NfceItemEditor
                  key={item.indice}
                  item={item}
                  products={produtos}
                  categories={categoriasProduto}
                  onChange={changes => updateItem(item.indice, changes)}
                />
              ))}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] px-5 pb-1 pt-4 md:-mx-7 md:px-7">
              {error && (
                <p className="status-danger mb-3 rounded-xl p-3 text-sm" role="alert" aria-live="assertive">
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={reset} disabled={isImporting} className="btn-outline px-5 py-3">Ler outra nota</button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={isImporting || selectedCount === 0}
                  aria-busy={isImporting}
                  className="btn-primary flex items-center justify-center gap-2 px-5 py-3 disabled:opacity-50"
                >
                  {isImporting && <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
                  {isImporting
                    ? 'Importando…'
                    : `Importar ${selectedCount} ${selectedCount === 1 ? 'item' : 'itens'}`}
                </button>
              </div>
            </div>
          </div>
        ) : isScanning ? (
          <div>
            <NfceScanner onDetected={handleDetected} />
            <button type="button" onClick={() => setIsScanning(false)} className="btn-outline mt-4 w-full px-4 py-3">Voltar</button>
          </div>
        ) : (
          <div className="space-y-5">
            <button type="button" onClick={() => setIsScanning(true)} className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-4 text-lg">
              <QrCode size={22} aria-hidden="true" /> Escanear QR Code
            </button>

            <div className="flex items-center gap-3 text-xs text-[var(--color-aurora-text-muted)]" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--color-aurora-border)]" /> ou <span className="h-px flex-1 bg-[var(--color-aurora-border)]" />
            </div>

            <form onSubmit={handleManualSubmit}>
              <label htmlFor="nfce-url" className="flex items-center gap-2 text-sm font-medium">
                <Keyboard size={16} aria-hidden="true" /> Link do QR Code ou chave de acesso
              </label>
              <textarea
                id="nfce-url"
                value={manualValue}
                onChange={event => setManualValue(event.target.value)}
                className="form-input mt-2 min-h-24 w-full p-3"
                placeholder="Cole o link ou digite os 44 números da chave"
              />
              <button type="submit" disabled={!manualValue.trim()} className="btn-outline mt-3 w-full px-4 py-3 disabled:opacity-50">Pesquisar nota</button>
            </form>

            {rateLimit && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-100" role="status" aria-live="polite">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{rateLimit.portal} em espera</p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">{rateLimit.message}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                      <span>Tentativas: {rateLimit.attempts}</span>
                      <span>{remainingSeconds > 0 ? `Nova tentativa em ${formatCountdown(remainingSeconds)}` : 'Nova tentativa liberada'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={retryPreview}
                      disabled={remainingSeconds > 0}
                      className="btn-outline mt-4 flex w-full items-center justify-center gap-2 px-4 py-3 disabled:cursor-wait disabled:opacity-50"
                    >
                      <RefreshCw size={17} aria-hidden="true" />
                      {remainingSeconds > 0 ? `Aguardar ${formatCountdown(remainingSeconds)}` : 'Tentar novamente'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {error && !rateLimit && <p className="status-danger rounded-xl p-3 text-sm" role="alert">{error}</p>}
            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--color-aurora-text-muted)]">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              A Aurora consulta somente portais públicos governamentais e não salva a nota sem sua confirmação.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
