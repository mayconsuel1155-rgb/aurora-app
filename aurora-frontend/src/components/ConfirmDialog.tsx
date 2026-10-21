import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop !z-[80]" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <div className="modal-panel max-w-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="status-danger flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
            <AlertTriangle aria-hidden="true" size={21} />
          </span>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="icon-button -mr-1 -mt-1">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <h2 id="confirm-dialog-title" className="mt-5 text-xl font-bold">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-[var(--color-aurora-text-muted)]">{description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="btn-outline px-4 py-3">Cancelar</button>
          <button type="button" onClick={onConfirm} className="rounded-[10px] bg-[var(--color-aurora-danger)] px-4 py-3 text-sm font-bold text-white transition-transform active:translate-y-px">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
