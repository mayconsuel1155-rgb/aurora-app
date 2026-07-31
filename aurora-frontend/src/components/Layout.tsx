import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, Sparkles, LogOut, User, Users, Network, Calendar, Moon, Sun, Activity, Wallet } from 'lucide-react';
import AIChatModal from './AIChatModal';
import { useStore } from '../store/useStore';
import { IosInstallPrompt } from './IosInstallPrompt';

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useStore();

  return (
    <div className="flex h-screen font-sans relative bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 z-10 relative transition-smooth">
        <div className="p-8 pt-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-blue-600 dark:text-blue-500" size={28} />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Aurora</h1>
          </div>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-10">Smart Living</p>
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
        <div className="p-6 pt-2">
          <div className="flex items-center justify-between px-3 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-smooth group">
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
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
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
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full text-slate-600 dark:text-slate-300 transition-smooth active:scale-95"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={logout}
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full text-rose-500 transition-smooth active:scale-95"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-0 relative text-slate-800 dark:text-slate-100 transition-colors duration-300 pt-20 md:pt-4 custom-scrollbar">
        {/* Massive Blue Radial Glow (SaaS signature) */}
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="p-4 md:p-8 max-w-6xl mx-auto relative z-10">
           <Outlet />
        </div>
      </main>

      {/* Floating Trigger Button for AI Aurora Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 btn-primary px-5 py-4 rounded-full flex items-center space-x-3 group"
          title="Conversar com a IA Aurora"
        >
          <Sparkles size={24} className="text-white" />
          <span className="hidden md:inline font-semibold text-sm">IA Aurora</span>
        </button>
      )}

      {/* AIChatModal Component */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* iOS Install Prompt */}
      <IosInstallPrompt />

      {/* Bottom Nav - Mobile with Glassmorphism */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 aurora-glass rounded-3xl flex overflow-x-auto justify-start sm:justify-around p-2 z-50 transition-smooth custom-scrollbar gap-1 hide-scroll shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <MobileNavItem to="/" icon={<Home size={22} />} label="Início" />
          <MobileNavItem to="/estoque" icon={<Package size={22} />} label="Estoque" />
          <MobileNavItem to="/compras" icon={<ShoppingCart size={22} />} label="Compras" />
          <MobileNavItem to="/despesas" icon={<Wallet size={22} />} label="Despesas" />
          <MobileNavItem to="/saude" icon={<Activity size={22} />} label="Saúde" />
          <MobileNavItem to="/agenda" icon={<Calendar size={22} />} label="Agenda" />
          <MobileNavItem to="/familia" icon={<Users size={22} />} label="Família" />
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
        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth group ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
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
        `flex flex-col items-center justify-center min-w-[64px] flex-1 py-2 space-y-1 transition-smooth rounded-2xl ${
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
