import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import Estoque from './pages/Estoque';
import Compras from './pages/Compras';
import Familia from './pages/Familia';
import Integracoes from './pages/Integracoes';
import Login from './pages/Login';
import Register from './pages/Register';
import Agenda from './pages/Agenda';
import Saude from './pages/Saude';
import Despesas from './pages/Despesas';
import { useStore } from './store/useStore';
import { NotificationService } from './services/NotificationService';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  const produtos = useStore(state => state.produtos);
  const eventos = useStore(state => state.eventos);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationBanner(true);
      } else if (Notification.permission === 'granted') {
        NotificationService.subscribeToWebPush();
      }
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
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setShowNotificationBanner(false);
      NotificationService.checkExpirations(produtos);
    }
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {showNotificationBanner && (
        <div className="bg-indigo-600 px-4 pt-3 pb-4 text-white flex flex-col md:flex-row gap-3 justify-between items-start md:items-center z-[70] fixed md:sticky top-0 left-0 right-0 shadow-lg">
          <p className="text-sm font-medium pr-12 md:pr-0">Ative as notificações para ser avisado sobre vencimentos na geladeira e despensa.</p>
          <div className="flex space-x-3 self-end flex-shrink-0">
            <button onClick={() => setShowNotificationBanner(false)} className="text-indigo-200 hover:text-white text-sm px-2 py-1">Depois</button>
            <button onClick={handleEnableNotifications} className="bg-white dark:bg-slate-800 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-50 shadow-sm">Ativar</button>
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Timeline />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="compras" element={<Compras />} />
          <Route path="despesas" element={<Despesas />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="familia" element={<Familia />} />
          <Route path="saude" element={<Saude />} />
          <Route path="integracoes" element={<Integracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
