import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Moon,
  Network,
  Package,
  ShoppingBasket,
  Sparkles,
  Sun,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import AIChatModal from './AIChatModal';
import { useStore } from '../store/useStore';
import { IosInstallPrompt } from './IosInstallPrompt';

const primaryNavigation = [
  { to: '/', icon: Home, label: 'Visão geral', end: true },
  { to: '/estoque', icon: Package, label: 'Estoque' },
  { to: '/compras', icon: ShoppingBasket, label: 'Compras' },
  { to: '/agenda', icon: CalendarDays, label: 'Agenda' },
];

const secondaryNavigation = [
  { to: '/despesas', icon: Wallet, label: 'Despesas' },
  { to: '/familia', icon: Users, label: 'Família' },
  { to: '/saude', icon: Activity, label: 'Saúde' },
  { to: '/integracoes', icon: Network, label: 'Integrações' },
];

const pageNames: Record<string, string> = {
  '/': 'Visão geral',
  '/estoque': 'Estoque',
  '/compras': 'Compras',
  '/agenda': 'Agenda',
  '/despesas': 'Despesas',
  '/familia': 'Família',
  '/saude': 'Saúde',
  '/integracoes': 'Integrações',
};

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useStore();
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || 'Aurora';
  const displayName = user?.nome && !/^(usuário\s+)?teste$/i.test(user.nome.trim()) ? user.nome : 'Morador';
  const currentDate = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date()), []);

  return (
    <div className="app-shell flex min-h-[100dvh] text-[var(--color-aurora-text)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-[var(--color-aurora-sidebar)] text-white lg:flex">
        <Brand />

        <nav aria-label="Navegação principal" className="custom-scrollbar flex-1 overflow-y-auto px-4 py-2">
          <NavSection label="Sua casa" items={primaryNavigation} />
          <NavSection label="Organização" items={secondaryNavigation} />
        </nav>

        <div className="p-4">
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="group mb-3 flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/[.07] px-4 py-3.5 text-left text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/[.12]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-aurora-accent)] text-[#173e2d]">
              <Sparkles aria-hidden="true" size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">IA Aurora</span>
              <span className="block truncate text-[11px] text-white/60">Tire dúvidas sobre sua rotina</span>
            </span>
            <ChevronRight aria-hidden="true" size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="flex items-center gap-3 border-t border-white/12 pt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80">
              <User aria-hidden="true" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-[11px] text-white/55">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} aria-label="Sair da conta" className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              <LogOut aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-aurora-border)] bg-[var(--color-aurora-bg)] px-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden"><Brand compact /></div>
            <div className="hidden sm:block">
              <p className="truncate text-sm font-semibold">{currentPage}</p>
              <p className="mt-0.5 text-[11px] capitalize text-[var(--color-aurora-text-muted)]">{currentDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="hidden text-xs font-medium text-[var(--color-aurora-text-muted)] sm:block">Tudo da casa em um só lugar</p>
            <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} className="icon-button border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)]">
              {theme === 'dark' ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
            </button>
            <button type="button" onClick={logout} aria-label="Sair da conta" className="icon-button border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] lg:hidden">
              <LogOut aria-hidden="true" size={16} />
            </button>
          </div>
        </header>

        <main id="main-content" className="min-w-0 flex-1 pb-28 lg:pb-10">
          <div className="page-container page-enter"><Outlet /></div>
        </main>
      </div>

      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-aurora-primary)] text-white shadow-[var(--shadow-float)] transition-[background-color,transform] hover:-translate-y-1 hover:bg-[var(--color-aurora-primary-hover)] lg:hidden"
          aria-label="Conversar com a IA Aurora"
        >
          <Sparkles aria-hidden="true" size={20} />
        </button>
      )}

      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <IosInstallPrompt />

      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="more-menu-title">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-[#101713]/55" onClick={() => setIsMoreOpen(false)} />
          <div className="absolute inset-x-3 bottom-24 rounded-2xl border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-3 shadow-[var(--shadow-float)]">
            <div className="flex items-center justify-between px-2 pb-2">
              <div>
                <p id="more-menu-title" className="text-sm font-semibold">Mais recursos</p>
                <p className="text-xs text-[var(--color-aurora-text-muted)]">Acesse outras áreas da casa</p>
              </div>
              <button type="button" onClick={() => setIsMoreOpen(false)} aria-label="Fechar menu" className="icon-button"><X aria-hidden="true" size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryNavigation.map(item => (
                <NavLink key={item.to} to={item.to} onClick={() => setIsMoreOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--color-aurora-border)] p-3 text-sm font-medium transition-colors hover:bg-[var(--color-aurora-soft)]">
                  <item.icon aria-hidden="true" size={18} className="text-[var(--color-aurora-primary)]" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Navegação móvel" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-1.5 shadow-[var(--shadow-float)] lg:hidden">
        {primaryNavigation.map(item => <MobileNavItem key={item.to} {...item} />)}
        <button type="button" onClick={() => setIsMoreOpen(true)} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[var(--color-aurora-text-muted)] transition-colors hover:bg-[var(--color-aurora-soft)]">
          <Menu aria-hidden="true" size={19} />
          <span className="text-[10px] font-semibold">Mais</span>
        </button>
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center' : 'flex h-24 items-center px-6'}>
      <div className="brand-mark"><Sparkles aria-hidden="true" size={compact ? 16 : 18} /></div>
      <div className={compact ? 'ml-2.5' : 'ml-3'}>
        <p className="text-[17px] font-bold tracking-[-.035em]">Aurora</p>
        {!compact && <p className="mt-0.5 text-[10px] font-semibold tracking-[.08em] text-white/55">Casa inteligente</p>}
      </div>
    </div>
  );
}

function NavSection({ label, items }: { label: string; items: typeof primaryNavigation }) {
  return (
    <section className="mb-7" aria-label={label}>
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/45">{label}</p>
      <div className="space-y-1">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </section>
  );
}

function MobileNavItem({ to, icon: Icon, label, end }: (typeof primaryNavigation)[number]) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors ${isActive ? 'surface-primary-soft' : 'text-[var(--color-aurora-text-muted)] hover:bg-[var(--color-aurora-soft)]'}`}>
      <Icon aria-hidden="true" size={19} />
      <span className="text-[10px] font-semibold">{label === 'Visão geral' ? 'Início' : label}</span>
    </NavLink>
  );
}
