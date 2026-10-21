import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBasket,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Evento } from '../api/client';
import PageHeader from '../components/PageHeader';

function eventDate(event: Evento) {
  if (!event.data) return null;
  return new Date(event.data.includes('T') ? event.data : `${event.data}T12:00:00`);
}

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export default function Timeline() {
  const { eventos, produtos, insight, fetchEventos, fetchProdutos, fetchInsight } = useStore();

  useEffect(() => {
    fetchEventos();
    fetchProdutos();
    fetchInsight();
  }, [fetchEventos, fetchProdutos, fetchInsight]);

  const data = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const validEvents = eventos.filter(event => !event.titulo.startsWith('[Concluído]'));
    const todayEvents = validEvents.filter(event => {
      const date = eventDate(event);
      return date ? sameDay(date, now) : false;
    });
    const tomorrowEvents = validEvents.filter(event => {
      const date = eventDate(event);
      return date ? sameDay(date, tomorrow) : false;
    });
    const lowStock = produtos.filter(product => product.quantidade <= product.quantidade_minima);
    const expiring = produtos.filter(product => {
      if (!product.validade || product.quantidade <= 0) return false;
      const days = Math.ceil((new Date(product.validade).getTime() - now.getTime()) / 86_400_000);
      return days <= 3;
    });
    return { todayEvents, tomorrowEvents, lowStock, expiring };
  }, [eventos, produtos]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const prioritiesCount = data.lowStock.length + data.expiring.length + data.todayEvents.length;

  return (
    <div className="page-stack pb-6">
      <PageHeader
        eyebrow="Resumo da casa"
        title={`${greeting}. Este é o resumo da sua casa.`}
        description="Confira as prioridades de hoje e organize o restante do dia com tranquilidade."
        action={<Link to="/estoque" className="btn-outline inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 sm:w-auto">
          <Package aria-hidden="true" size={16} /> Gerenciar estoque
        </Link>}
      />

      <section aria-labelledby="house-numbers-title">
        <h2 id="house-numbers-title" className="sr-only">Números da casa</h2>
        <div className="aurora-ledger sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Package} label="Itens em casa" value={produtos.length} helper="produtos cadastrados" />
          <Metric icon={ShoppingBasket} label="Para repor" value={data.lowStock.length} helper={data.lowStock.length ? 'abaixo do mínimo' : 'estoque em dia'} attention={data.lowStock.length > 0} />
          <Metric icon={CalendarDays} label="Agenda hoje" value={data.todayEvents.length} helper={data.todayEvents.length ? 'compromissos' : 'dia livre'} />
          <Metric icon={TriangleAlert} label="Validade" value={data.expiring.length} helper={data.expiring.length ? 'pedem atenção' : 'nenhum alerta'} attention={data.expiring.length > 0} />
        </div>
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Prioridades de hoje</h2>
              <p className="mt-1 text-sm text-[var(--color-aurora-text-muted)]">
                {prioritiesCount ? `${prioritiesCount} ${prioritiesCount === 1 ? 'ponto pede' : 'pontos pedem'} sua atenção` : 'Nenhuma pendência para hoje'}
              </p>
            </div>
            <Clock3 aria-hidden="true" size={19} className="text-[var(--color-aurora-text-muted)]" />
          </div>

          <div className="aurora-panel">
            {data.lowStock.length > 0 && (
              <PriorityRow
                icon={ShoppingBasket}
                tone="attention"
                title={`${data.lowStock.length} ${data.lowStock.length === 1 ? 'item precisa' : 'itens precisam'} de reposição`}
                description={data.lowStock.slice(0, 3).map(item => item.nome).join(', ')}
                to="/compras"
                action="Ver compras"
              />
            )}
            {data.expiring.length > 0 && (
              <PriorityRow
                icon={TriangleAlert}
                tone="error"
                title={`${data.expiring.length} ${data.expiring.length === 1 ? 'produto pede' : 'produtos pedem'} atenção`}
                description="Confira os itens vencidos ou próximos do vencimento."
                to="/estoque"
                action="Revisar estoque"
              />
            )}
            {data.todayEvents.map(event => (
              <PriorityRow
                key={event.id}
                icon={CalendarDays}
                tone="primary"
                title={event.titulo}
                description={formatEventTime(event)}
                to="/agenda"
                action="Abrir agenda"
              />
            ))}
            {!prioritiesCount && (
              <div className="flex flex-col items-start px-6 py-12 sm:px-8">
                <span className="surface-primary-soft flex h-11 w-11 items-center justify-center rounded-xl"><CheckCircle2 aria-hidden="true" size={21} /></span>
                <h3 className="mt-4 text-base font-semibold">Tudo tranquilo por aqui</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--color-aurora-text-muted)]">Nenhum alerta ou compromisso pendente para hoje.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-7" aria-label="Contexto e próximos compromissos">
          <section className="rounded-2xl border border-[var(--color-aurora-primary)]/20 bg-[var(--color-aurora-primary-soft)] p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-aurora-primary)] text-white"><Sparkles aria-hidden="true" size={18} /></span>
            <p className="mt-5 text-xs font-semibold text-[var(--color-aurora-primary)]">Sugestão da Aurora</p>
            <h2 className="mt-2 text-lg font-semibold">Uma sugestão para você</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-aurora-text-muted)]">
              {insight?.mensagem || 'A Aurora está analisando sua rotina para preparar uma sugestão útil.'}
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between border-b border-[var(--color-aurora-border)] pb-3">
              <div>
                <h2 className="text-base font-semibold">Amanhã</h2>
                <p className="mt-0.5 text-xs text-[var(--color-aurora-text-muted)]">Veja os próximos compromissos</p>
              </div>
              <CalendarDays aria-hidden="true" size={18} className="text-[var(--color-aurora-text-muted)]" />
            </div>
            <div className="mt-3 space-y-2">
              {data.tomorrowEvents.slice(0, 3).map(event => (
                <div key={event.id} className="rounded-xl bg-[var(--color-aurora-surface)] px-4 py-3">
                  <p className="truncate text-sm font-medium">{event.titulo}</p>
                  <p className="mt-1 text-[11px] text-[var(--color-aurora-text-muted)]">{formatEventTime(event)}</p>
                </div>
              ))}
              {!data.tomorrowEvents.length && <p className="py-4 text-sm text-[var(--color-aurora-text-muted)]">Nenhum compromisso agendado.</p>}
            </div>
            <Link to="/agenda" className="text-action mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
              Ver agenda completa <ArrowRight aria-hidden="true" size={13} />
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}

type IconComponent = typeof Package;

function Metric({ icon: Icon, label, value, helper, attention = false }: { icon: IconComponent; label: string; value: number; helper: string; attention?: boolean }) {
  return (
    <div className="relative flex min-h-32 items-center gap-4 border-b border-[var(--color-aurora-border)] p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(3)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      {attention && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-[var(--color-aurora-accent)]" />}
      <Icon aria-hidden="true" size={20} className={attention ? 'text-[var(--color-aurora-accent)]' : 'text-[var(--color-aurora-primary)]'} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--color-aurora-text-muted)]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <strong className="text-3xl font-semibold tracking-[-.04em]">{value}</strong>
          <span className="truncate text-[11px] text-[var(--color-aurora-text-muted)]">{helper}</span>
        </div>
      </div>
    </div>
  );
}

function PriorityRow({ icon: Icon, tone, title, description, to, action }: { icon: IconComponent; tone: 'primary' | 'attention' | 'error'; title: string; description: string; to: string; action: string }) {
  const toneClass = {
    primary: 'surface-primary-soft',
    attention: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  }[tone];

  return (
    <article className="render-item group flex flex-col gap-4 border-b border-[var(--color-aurora-border)] px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:px-6">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}><Icon aria-hidden="true" size={18} /></span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        <p className="mt-1 truncate text-xs text-[var(--color-aurora-text-muted)]">{description}</p>
      </div>
      <Link to={to} className="text-action inline-flex items-center gap-1.5 text-xs font-semibold">
        {action} <ArrowRight aria-hidden="true" size={13} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

function formatEventTime(event: Evento) {
  if (!event.data?.includes('T')) return 'Evento de dia inteiro';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.data));
}
