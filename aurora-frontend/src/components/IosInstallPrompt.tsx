import { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detecta se é iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Detecta se já está rodando como standalone (instalado)
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator && (window.navigator as any).standalone) || 
             window.matchMedia('(display-mode: standalone)').matches;
    };

    if (isIos() && !isInStandaloneMode()) {
      const hasDismissed = localStorage.getItem('aurora-ios-install-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('aurora-ios-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-indigo-100 dark:border-indigo-900 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <img src="/pwa-192x192.png" alt="Icone Aurora" className="w-8 h-8 object-contain" />
          </div>
          <div className="pr-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Instale o Aurora no iPhone</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Para usar como aplicativo, toque em <Share size={14} className="inline text-blue-500 mx-1" /> Compartilhar e depois em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={14} className="inline text-slate-600 dark:text-slate-300 mx-1" />.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
