import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useStore } from './store/useStore';
import { NotificationService } from './services/NotificationService';
import { lazy, Suspense, useEffect, useState } from 'react';

const Agenda = lazy(() => import('./pages/Agenda'));
const Compras = lazy(() => import('./pages/Compras'));
const Despesas = lazy(() => import('./pages/Despesas'));
const Estoque = lazy(() => import('./pages/Estoque'));
const Familia = lazy(() => import('./pages/Familia'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Integracoes = lazy(() => import('./pages/Integracoes'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Saude = lazy(() => import('./pages/Saude'));
const Timeline = lazy(() => import('./pages/Timeline'));

function RouteFallback() {
  return (
    <div role="status" className="page-container space-y-4" aria-label="Carregando página">
      <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-aurora-primary-soft)]" />
      <div className="h-12 w-3/4 max-w-xl animate-pulse rounded-xl bg-[var(--color-aurora-soft)]" />
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-aurora-surface)]" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  const produtos = useStore(state => state.produtos);
  const eventos = useStore(state => state.eventos);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('Ative as notificações para ser avisado sobre vencimentos na geladeira e despensa.');
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationMessage('Este navegador não suporta notificações.');
      setShowNotificationBanner(true);
      return;
    }

    if (Notification.permission === 'granted') {
      NotificationService.subscribeToWebPush()
        .then(() => setShowNotificationBanner(false))
        .catch((error: Error) => {
          setNotificationMessage(error.message);
          setShowNotificationBanner(true);
        });
    } else {
      if (Notification.permission === 'denied') {
        setNotificationMessage('As notificações estão bloqueadas. Clique no cadeado da barra de endereços e altere a permissão para Permitir.');
      }
      setShowNotificationBanner(true);
    }
  }, []);

  useEffect(() => {
    if (token && eventos.length > 0) {
      NotificationService.startEventMonitor(eventos);
    }
    return () => {
      NotificationService.stopEventMonitor();
    };
  }, [eventos, token]);

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    try {
      const granted = await NotificationService.requestPermission();
      if (granted) {
        setShowNotificationBanner(false);
        await NotificationService.checkExpirations(produtos);
      }
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : 'Não foi possível ativar as notificações.');
      setShowNotificationBanner(true);
    } finally {
      setEnablingNotifications(false);
    }
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {showNotificationBanner && (
        <div role="status" aria-live="polite" className="fixed left-0 right-0 top-0 z-[70] flex flex-col items-start justify-between gap-3 bg-[var(--color-aurora-primary)] px-4 pb-4 pt-3 text-white shadow-[var(--shadow-float)] md:sticky md:flex-row md:items-center">
          <p className="text-sm font-medium pr-12 md:pr-0">{notificationMessage}</p>
          <div className="flex space-x-3 self-end flex-shrink-0">
            <button type="button" onClick={() => setShowNotificationBanner(false)} className="rounded-md px-2 py-1 text-sm text-white/70 transition-colors hover:text-white">Depois</button>
            <button
              onClick={handleEnableNotifications}
              disabled={enablingNotifications}
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#173e2d] shadow-sm transition-colors hover:bg-[#f3f4ef] disabled:cursor-wait disabled:opacity-70"
            >
              {enablingNotifications ? 'Ativando…' : 'Ativar notificações'}
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

function App() {
  const theme = useStore(state => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Timeline />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="compras" element={<Compras />} />
          <Route path="despesas" element={<Despesas />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="familia" element={<Familia />} />
          <Route path="saude" element={<Saude />} />
          <Route path="integracoes" element={<Integracoes />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
