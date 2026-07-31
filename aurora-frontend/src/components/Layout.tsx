import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Package, ShoppingCart, Sparkles, LogOut, User, Users, Network, Calendar, Moon, Sun, Activity, LayoutGrid } from 'lucide-react';
import AIChatModal from './AIChatModal';
import { useStore } from '../store/useStore';
import { IosInstallPrompt } from './IosInstallPrompt';

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useStore();

  return (
    <div className="flex h-screen font-sans relative transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#FAFAFA] dark:bg-[#000000] border-r border-[#EAEAEA] dark:border-[#262626] z-10 relative transition-smooth">
        <div className="p-6 pt-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-black dark:text-white" size={20} />
            <h1 className="text-xl font-bold tracking-tight text-[#171717] dark:text-[#EDEDED]">Aurora</h1>
          </div>
          <p className="text-[10px] font-semibold text-[#666666] dark:text-[#A1A1AA] uppercase tracking-widest pl-7">Smart Living</p>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar pb-4">
          <NavItem to="/" icon={<Home size={18} strokeWidth={1.5} />} label="Rotina" />
          <NavItem to="/estoque" icon={<Package size={18} strokeWidth={1.5} />} label="Estoque" />
          <NavItem to="/compras" icon={<ShoppingCart size={18} strokeWidth={1.5} />} label="Compras" />
          <NavItem to="/familia" icon={<Users size={18} strokeWidth={1.5} />} label="Família" />
          <NavItem to="/ambientes" icon={<LayoutGrid size={18} strokeWidth={1.5} />} label="Ambientes" />
          <NavItem to="/agenda" icon={<Calendar size={18} strokeWidth={1.5} />} label="Agenda" />
          <NavItem to="/saude" icon={<Activity size={18} strokeWidth={1.5} />} label="Saúde & Remédios" />
          <NavItem to="/integracoes" icon={<Network size={18} strokeWidth={1.5} />} label="Aurora Connect" />
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 pt-2">
          <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#0A0A0A] rounded-lg border border-[#EAEAEA] dark:border-[#262626] transition-smooth group">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#F5F5F5] dark:bg-[#171717] text-[#171717] dark:text-[#EDEDED] flex items-center justify-center shrink-0 border border-[#EAEAEA] dark:border-[#262626]">
                <User size={12} />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-[#171717] dark:text-[#EDEDED] truncate">{user?.nome || 'Usuário'}</p>
                <p className="text-[10px] text-[#666666] dark:text-[#A1A1AA] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={toggleTheme}
                title="Mudar Tema"
                className="p-1.5 text-[#666666] hover:text-[#171717] dark:text-[#A1A1AA] dark:hover:text-[#EDEDED] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] rounded-md transition-colors"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button 
                onClick={logout}
                title="Sair"
                className="p-1.5 text-[#666666] hover:text-rose-600 dark:text-[#A1A1AA] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Actions */}
      <div className="md:hidden fixed top-4 right-4 z-50 flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-[#0A0A0A] border border-[#EAEAEA] dark:border-[#262626] rounded-md text-[#171717] dark:text-[#EDEDED] transition-smooth active:scale-95"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={logout}
          className="p-2 bg-white dark:bg-[#0A0A0A] border border-[#EAEAEA] dark:border-[#262626] rounded-md text-[#171717] dark:text-[#EDEDED] transition-smooth active:scale-95"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-0 relative text-[#171717] dark:text-[#EDEDED] bg-[#FFFFFF] dark:bg-[#0A0A0A] transition-colors duration-300 pt-16 md:pt-4 custom-scrollbar">
        <div className="p-4 md:p-8 max-w-5xl mx-auto relative z-10">
           <Outlet />
        </div>
      </main>

      {/* Floating Trigger Button for AI Aurora Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 bg-[#171717] dark:bg-[#EDEDED] text-white dark:text-[#171717] px-4 py-2.5 rounded-full flex items-center space-x-2 hover:opacity-90 transition-all text-sm font-medium"
          title="Conversar com a IA Aurora"
        >
          <Sparkles size={16} />
          <span className="hidden md:inline">IA Aurora</span>
        </button>
      )}

      {/* AIChatModal Component */}
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* iOS Install Prompt */}
      <IosInstallPrompt />

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white dark:bg-[#0A0A0A] border border-[#EAEAEA] dark:border-[#262626] rounded-xl flex overflow-x-auto justify-start sm:justify-around p-1.5 z-50 transition-smooth custom-scrollbar gap-1 hide-scroll shadow-sm">
          <MobileNavItem to="/" icon={<Home size={20} />} label="Início" />
          <MobileNavItem to="/estoque" icon={<Package size={20} />} label="Estoque" />
          <MobileNavItem to="/compras" icon={<ShoppingCart size={20} />} label="Compras" />
          <MobileNavItem to="/familia" icon={<Users size={20} />} label="Família" />
          <MobileNavItem to="/ambientes" icon={<LayoutGrid size={20} />} label="Ambientes" />
          <MobileNavItem to="/agenda" icon={<Calendar size={20} />} label="Agenda" />
          <MobileNavItem to="/saude" icon={<Activity size={20} />} label="Saúde" />
          <MobileNavItem to="/integracoes" icon={<Network size={20} />} label="Connect" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2 rounded-md transition-smooth group text-sm ${
          isActive
            ? 'bg-[#EAEAEA] dark:bg-[#262626] text-[#171717] dark:text-[#EDEDED] font-medium'
            : 'text-[#666666] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] hover:text-[#171717] dark:hover:text-[#EDEDED]'
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
        `flex flex-col items-center justify-center p-2 rounded-lg min-w-[64px] transition-smooth ${
          isActive
            ? 'text-[#171717] dark:text-[#EDEDED]'
            : 'text-[#666666] dark:text-[#A1A1AA]'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </NavLink>
  );
}
