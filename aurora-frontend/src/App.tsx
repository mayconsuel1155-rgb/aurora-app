import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Compras from './pages/Compras';
import Familia from './pages/Familia';
import Login from './pages/Login';
import Register from './pages/Register';
import { useStore } from './store/useStore';
import { NotificationService } from './services/NotificationService';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  const produtos = useStore(state => state.produtos);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowNotificationBanner(true);
    }
  }, []);

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
        <div className="bg-indigo-600 px-4 py-3 text-white flex justify-between items-center z-40 sticky top-0">
          <p className="text-sm font-medium">Ative as notificações para ser avisado sobre vencimentos na geladeira e despensa.</p>
          <div className="flex space-x-3 ml-4 flex-shrink-0">
            <button onClick={() => setShowNotificationBanner(false)} className="text-indigo-200 hover:text-white text-sm">Depois</button>
            <button onClick={handleEnableNotifications} className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-bold hover:bg-indigo-50">Ativar</button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="compras" element={<Compras />} />
          <Route path="familia" element={<Familia />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
