import type { ReactNode } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const benefits = [
  'Estoque sempre visível',
  'Rotina compartilhada',
  'Alertas no momento certo',
];

export default function AuthLayout({ eyebrow, title, description, children, footer }: AuthLayoutProps) {
  return (
    <main id="main-content" className="relative min-h-[100dvh] overflow-hidden bg-[#173e2d] px-4 py-5 text-white sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-3 bottom-0 select-none font-[var(--font-display)] text-[28vw] font-bold leading-[.72] tracking-[-.08em] text-white/[.035]">
        CASA
      </div>

      <div className="relative mx-auto grid min-h-[calc(100dvh-40px)] w-full min-w-0 max-w-[1320px] content-start grid-cols-1 gap-8 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-12 lg:content-normal lg:items-center lg:gap-8">
        <section className="flex flex-col pt-1 lg:col-span-7 lg:min-h-[72vh] lg:justify-between lg:py-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark"><Sparkles aria-hidden="true" size={18} /></div>
            <div>
              <p className="text-lg font-bold tracking-tight">Aurora</p>
              <p className="text-xs text-white/55">Casa inteligente</p>
            </div>
          </div>

          <div className="hidden max-w-2xl lg:block">
            <p className="mb-5 max-w-md text-sm font-semibold text-[#efb950]">Tudo da sua casa em um só lugar</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.03] tracking-[-.055em] xl:text-6xl">
              Menos tarefas na cabeça. Mais tempo para sua família.
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-7 text-white/66">
              Organize compras, compromissos e tarefas da casa com todos que moram com você.
            </p>
          </div>

          <div className="hidden grid-cols-3 gap-5 border-t border-white/14 pt-5 lg:grid">
            {benefits.map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-white/72">
                <Check aria-hidden="true" className="mt-0.5 shrink-0 text-[#efb950]" size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="box-border w-[calc(100vw-2rem)] min-w-0 max-w-full self-center overflow-hidden rounded-[24px] bg-[var(--color-aurora-surface)] px-5 py-8 text-[var(--color-aurora-text)] shadow-[0_28px_80px_rgba(6,24,16,.3)] sm:w-full sm:px-9 sm:py-10 lg:col-span-5 lg:-ml-4 lg:px-10 xl:px-12">
          <div className="mx-auto w-full min-w-0 max-w-md">
            <span className="ui-label surface-primary-soft">{eyebrow}</span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-[44ch] text-sm leading-6 text-[var(--color-aurora-text-muted)]">{description}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 break-words border-t border-[var(--color-aurora-border)] pt-6 text-center text-sm leading-6 text-[var(--color-aurora-text-muted)]">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
