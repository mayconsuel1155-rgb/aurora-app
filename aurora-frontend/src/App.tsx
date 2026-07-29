import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Compras from './pages/Compras';
import Familia from './pages/Familia';
import Login from './pages/Login';
import Register from './pages/Register';
import { useStore } from './store/useStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
