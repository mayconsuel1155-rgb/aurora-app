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
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      return Boolean(navigatorWithStandalone.standalone) ||
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
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 page-enter">
      <div className="relative flex flex-col gap-3 rounded-2xl border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-4 shadow-[var(--shadow-float)]">
        <button 
          onClick={handleDismiss}
          type="button"
          aria-label="Fechar instruções de instalação"
          className="icon-button absolute right-2 top-2"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-aurora-primary)]">
            <img src="/pwa-192x192.png" alt="Ícone Aurora" width="32" height="32" className="h-8 w-8 object-contain" />
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
