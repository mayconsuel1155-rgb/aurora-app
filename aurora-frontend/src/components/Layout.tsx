import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, Sparkles, LogOut, User, Users, Network, Calendar, Moon, Sun, Activity, Wallet } from 'lucide-react';
import AIChatModal from './AIChatModal';
import { useStore } from '../store/useStore';

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useStore();

  return (
    <div className="flex h-screen font-sans relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--color-aurora-surface-solid)] dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative transition-colors duration-300">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-aurora-primary)] to-indigo-400 dark:from-indigo-400 dark:to-purple-300">Aurora Home</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar pb-4">
          <NavItem to="/" icon={<Home size={22} strokeWidth={1.5} />} label="Rotina" />
          <NavItem to="/estoque" icon={<Package size={22} strokeWidth={1.5} />} label="Inventário" />
          <NavItem to="/compras" icon={<ShoppingCart size={22} strokeWidth={1.5} />} label="Lista de Compras" />
          <NavItem to="/despesas" icon={<Wallet size={22} strokeWidth={1.5} />} label="Despesas da Casa" />
          <NavItem to="/familia" icon={<Users size={22} strokeWidth={1.5} />} label="Minha Família" />
          <NavItem to="/agenda" icon={<Calendar size={22} strokeWidth={1.5} />} label="Agenda" />
          <NavItem to="/saude" icon={<Activity size={22} strokeWidth={1.5} />} label="Saúde & Remédios" />
          <NavItem to="/integracoes" icon={<Network size={22} strokeWidth={1.5} />} label="Aurora Connect" />
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-2 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl transition-colors">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-primary)]/10 text-[var(--color-aurora-primary)] dark:text-indigo-400 flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.nome || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Minha Casa</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                onClick={toggleTheme}
                title="Mudar Tema"
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={logout}
                title="Sair"
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Actions */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white/80 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={logout}
          className="p-2.5 bg-white/80 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50 text-rose-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative text-slate-800 dark:text-slate-100 transition-colors duration-300 pt-16 md:pt-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-transparent to-transparent pointer-events-none" />
        <div className="p-4 md:p-10 max-w-5xl mx-auto mt-2 md:mt-0 relative z-10">
           <Outlet />
        </div>
      </main>

      {/* Floating Trigger Button for AI Aurora Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-gradient-to-r from-[var(--color-aurora-primary)] via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-2 group border border-white/20"
          title="Conversar com a IA Aurora"
        >
          <Sparkles size={24} className="animate-pulse text-amber-300" />
          <span className="hidden md:inline font-semibold pr-2 text-sm">IA Aurora</span>
        </button>
      )}

      {/* AIChatModal Component */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Bottom Nav - Mobile with Glassmorphism */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white dark:border-slate-700 shadow-xl rounded-3xl flex justify-around p-2 z-50 transition-colors duration-300">
          <MobileNavItem to="/" icon={<Home size={22} />} label="Início" />
          <MobileNavItem to="/estoque" icon={<Package size={22} />} label="Estoque" />
          <MobileNavItem to="/compras" icon={<ShoppingCart size={22} />} label="Compras" />
          <MobileNavItem to="/despesas" icon={<Wallet size={22} />} label="Despesas" />
          <MobileNavItem to="/agenda" icon={<Calendar size={22} />} label="Agenda" />
          <MobileNavItem to="/integracoes" icon={<Network size={22} />} label="Connect" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-2xl transition-smooth ${
          isActive
            ? 'bg-[var(--color-aurora-primary)] text-white shadow-lg shadow-[var(--color-aurora-primary)]/20'
            : 'text-[var(--color-aurora-text-muted)] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-[var(--color-aurora-text)] dark:hover:text-slate-200'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full py-2 space-y-1 transition-smooth rounded-2xl ${
          isActive 
            ? 'text-[var(--color-aurora-primary)] bg-white/50 dark:bg-slate-700/50 shadow-sm' 
            : 'text-[var(--color-aurora-text-muted)] dark:text-slate-400 hover:text-[var(--color-aurora-text)] dark:hover:text-slate-200'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
