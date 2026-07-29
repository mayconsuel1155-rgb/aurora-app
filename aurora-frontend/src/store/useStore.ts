import { create } from 'zustand';
import { getProdutos, getInsights, updateProduto, createProduto, deleteProduto, getAmbientes, createAmbiente, deleteAmbiente, getMembros, type Produto, type Insight, type Ambiente, type Usuario, type Membro } from '../api/client';
import { NotificationService } from '../services/NotificationService';

interface StoreState {
  token: string | null;
  user: Usuario | null;
  produtos: Produto[];
  ambientes: Ambiente[];
  membros: Membro[];
  insight: Insight | null;
  loading: boolean;
  
  setAuth: (token: string, user: Usuario) => void;
  logout: () => void;
  fetchProdutos: () => Promise<void>;
  fetchAmbientes: () => Promise<void>;
  fetchMembros: () => Promise<void>;
  fetchInsight: () => Promise<void>;
  alterarQuantidade: (produtoId: number, delta: number) => Promise<void>;
  adicionarProduto: (produto: Omit<Produto, 'id' | 'casa_id'>) => Promise<void>;
  removerProduto: (produtoId: number) => Promise<void>;
  marcarComoComprado: (produto: Produto) => Promise<void>;
  adicionarAmbiente: (ambiente: Omit<Ambiente, 'id' | 'casa_id'>) => Promise<void>;
  removerAmbiente: (ambienteId: number) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  token: localStorage.getItem('aurora-token'),
  user: localStorage.getItem('aurora-user') ? JSON.parse(localStorage.getItem('aurora-user')!) : null,
  produtos: [],
  ambientes: [],
  membros: [],
  insight: null,
  loading: false,

  setAuth: (token, user) => {
    localStorage.setItem('aurora-token', token);
    localStorage.setItem('aurora-user', JSON.stringify(user));
    set({ token, user });
    get().fetchProdutos();
    get().fetchAmbientes();
    get().fetchMembros();
    get().fetchInsight();
  },

  logout: () => {
    localStorage.removeItem('aurora-token');
    localStorage.removeItem('aurora-user');
    set({ token: null, user: null, produtos: [], ambientes: [], membros: [], insight: null });
  },

  fetchProdutos: async () => {
    set({ loading: true });
    try {
      const data = await getProdutos();
      set({ produtos: Array.isArray(data) ? data : [], loading: false });
      
      // Checar vencimentos silenciosamente após carregar
      if (Array.isArray(data)) {
        setTimeout(() => {
          NotificationService.checkExpirations(data);
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      set({ produtos: [], loading: false });
    }
  },
  fetchAmbientes: async () => {
    try {
      const data = await getAmbientes();
      set({ ambientes: Array.isArray(data) ? data : [] });
    } catch (e) {
      console.error(e);
      set({ ambientes: [] });
    }
  },
  fetchMembros: async () => {
    try {
      const data = await getMembros();
      set({ membros: Array.isArray(data) ? data : [] });
    } catch (e) {
      console.error(e);
      set({ membros: [] });
    }
  },
  fetchInsight: async () => {
    try {
      const data = await getInsights();
      set({ insight: data });
    } catch (e) {
      console.error(e);
    }
  },
  alterarQuantidade: async (produtoId: number, delta: number) => {
    const { produtos } = get();
    const prod = produtos.find(p => p.id === produtoId);
    if (!prod) return;
    const novaQtd = Math.max(0, (prod.quantidade ?? 0) + delta);
    
    set({
      produtos: produtos.map(p => p.id === produtoId ? { ...p, quantidade: novaQtd } : p)
    });

    try {
      await updateProduto(produtoId, { quantidade: novaQtd });
      get().fetchInsight();
    } catch (e) {
      console.error('Erro ao atualizar produto:', e);
      get().fetchProdutos();
    }
  },
  adicionarProduto: async (novoProduto) => {
    try {
      await createProduto(novoProduto);
      await get().fetchProdutos();
      await get().fetchInsight();
    } catch (e) {
      console.error('Erro ao adicionar produto:', e);
    }
  },
  removerProduto: async (produtoId: number) => {
    const { produtos } = get();
    set({
      produtos: produtos.filter(p => p.id !== produtoId)
    });

    try {
      await deleteProduto(produtoId);
      get().fetchInsight();
    } catch (e) {
      console.error('Erro ao remover produto:', e);
      get().fetchProdutos();
    }
  },
  marcarComoComprado: async (produto: Produto) => {
    if (!produto) return;
    const qtdAtual = produto.quantidade ?? 0;
    const qtdMin = produto.quantidade_minima ?? 0;
    const novaQtd = Math.max(qtdAtual + 1, qtdMin + 1);

    const { produtos } = get();
    set({
      produtos: produtos.map(p => p.id === produto.id ? { ...p, quantidade: novaQtd } : p)
    });

    try {
      await updateProduto(produto.id, { quantidade: novaQtd });
      get().fetchInsight();
    } catch (e) {
      console.error('Erro ao marcar como comprado:', e);
      get().fetchProdutos();
    }
  },
  adicionarAmbiente: async (novoAmbiente) => {
    try {
      await createAmbiente(novoAmbiente);
      await get().fetchAmbientes();
    } catch (e) {
      console.error('Erro ao adicionar ambiente:', e);
    }
  },
  removerAmbiente: async (ambienteId: number) => {
    const { ambientes } = get();
    set({
      ambientes: ambientes.filter(a => a.id !== ambienteId)
    });

    try {
      await deleteAmbiente(ambienteId);
      get().fetchProdutos();
    } catch (e) {
      console.error('Erro ao remover ambiente:', e);
      get().fetchAmbientes();
    }
  }
}));
