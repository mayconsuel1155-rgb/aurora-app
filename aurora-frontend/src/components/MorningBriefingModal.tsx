import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Sun, CheckCircle2, Calendar as CalendarIcon, Package, X } from 'lucide-react';

export default function MorningBriefingModal() {
  const { user, eventos, produtos, insight } = useStore();
  const [isOpen, setIsOpen] = useState(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('aurora-morning-briefing');
    return lastShown !== today;
  });

  useEffect(() => {
    if (!isOpen) {
      // Quando o usuário fechar manualmente, salva no local storage para o futuro
      const today = new Date().toDateString();
      localStorage.setItem('aurora-morning-briefing', today);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hoje = new Date();
  
  // Eventos de hoje
  const eventosHoje = eventos.filter(e => {
    if (!e.data) return false;
    const dt = new Date(e.data);
    return dt.getDate() === hoje.getDate() && dt.getMonth() === hoje.getMonth();
  });

  // Produtos faltando ou vencendo
  const itensEmFalta = produtos.filter(p => (p.quantidade ?? 0) <= (p.quantidade_minima ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header (Gradient) */}
        <div className="bg-gradient-to-br from-amber-200 via-orange-100 to-amber-50 p-6 relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/40 hover:bg-white/60 rounded-full text-amber-700 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Sun size={28} className="text-amber-500 animate-spin-slow" />
            <h2 className="text-2xl font-bold text-amber-900">Bom dia, {user?.nome?.split(' ')?.[0] || ''}!</h2>
          </div>
          <p className="text-amber-800 text-sm opacity-90 font-medium">
            Aqui está o seu resumo para hoje, {hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Agenda */}
          <div className="flex space-x-4">
            <div className="bg-blue-50 p-3 rounded-2xl h-fit text-blue-600">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Sua Agenda</h3>
              {eventosHoje.length > 0 ? (
                <p className="text-slate-600">Você tem <span className="font-bold text-blue-600">{eventosHoje.length} compromisso(s)</span> agendados para hoje.</p>
              ) : (
                <p className="text-slate-600">Sua agenda está livre para hoje. Respire fundo e aproveite!</p>
              )}
            </div>
          </div>

          {/* Estoque */}
          <div className="flex space-x-4">
            <div className="bg-amber-50 p-3 rounded-2xl h-fit text-amber-600">
              <Package size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">Sua Casa</h3>
              {itensEmFalta.length > 0 ? (
                <p className="text-slate-600">Há <span className="font-bold text-amber-600">{itensEmFalta.length} item(ns)</span> precisando de reposição na sua despensa.</p>
              ) : (
                <p className="text-slate-600">Sua despensa está completamente abastecida.</p>
              )}
            </div>
          </div>

          {/* Insight da IA */}
          {insight && (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">Dica do Aurora</h3>
              <p className="text-indigo-900/80 text-sm font-medium">{insight.mensagem}</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
          >
            <CheckCircle2 size={18} />
            <span>Vamos nessa!</span>
          </button>
        </div>

      </div>
    </div>
  );
}
