import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, Sparkles, LogOut, User, Users } from 'lucide-react';
import AIChatModal from './AIChatModal';
import { useStore } from '../store/useStore';

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout } = useStore();

  return (
    <div className="flex h-screen font-sans relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[var(--color-aurora-surface-solid)] border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-aurora-primary)] to-indigo-400">Aurora Home</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem to="/" icon={<Home size={22} strokeWidth={1.5} />} label="Resumo" />
          <NavItem to="/estoque" icon={<Package size={22} strokeWidth={1.5} />} label="Estoque" />
          <NavItem to="/compras" icon={<ShoppingCart size={22} strokeWidth={1.5} />} label="Compras" />
          <NavItem to="/familia" icon={<Users size={22} strokeWidth={1.5} />} label="Minha Família" />
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 py-3 bg-slate-50 rounded-2xl">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-primary)]/10 text-[var(--color-aurora-primary)] flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.nome || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 truncate">Minha Casa</p>
              </div>
            </div>
            <button 
              onClick={logout}
              title="Sair"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
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
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/70 backdrop-blur-xl border border-white shadow-xl rounded-3xl flex justify-around p-2 z-50">
          <MobileNavItem to="/" icon={<Home size={24} strokeWidth={1.5} />} label="Resumo" />
          <MobileNavItem to="/estoque" icon={<Package size={24} strokeWidth={1.5} />} label="Estoque" />
          <MobileNavItem to="/compras" icon={<ShoppingCart size={24} strokeWidth={1.5} />} label="Compras" />
          <MobileNavItem to="/familia" icon={<Users size={24} strokeWidth={1.5} />} label="Família" />
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
            : 'text-[var(--color-aurora-text-muted)] hover:bg-slate-50 hover:text-[var(--color-aurora-text)]'
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
            ? 'text-[var(--color-aurora-primary)] bg-white/50 shadow-sm' 
            : 'text-[var(--color-aurora-text-muted)] hover:text-[var(--color-aurora-text)]'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
