import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="empty-state min-h-[55dvh]">
      <span className="empty-state-icon"><Home aria-hidden="true" size={23} /></span>
      <p className="page-eyebrow mt-5">Página não encontrada</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Este cômodo não existe.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-aurora-text-muted)]">
        O endereço pode ter mudado. Volte ao resumo para continuar organizando sua casa.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-3">
        <ArrowLeft aria-hidden="true" size={16} /> Voltar ao resumo
      </Link>
    </section>
  );
}
