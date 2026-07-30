import { create } from 'zustand';
import { getProdutos, getInsights, updateProduto, createProduto, deleteProduto, getAmbientes, createAmbiente, deleteAmbiente, getMembros, getEventos, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, getInboxEvents, getRemedios, createRemedio, deleteRemedio, toggleRemedio as toggleRemedioApi, type Produto, type Insight, type Ambiente, type Usuario, type Membro, type Evento, type InboxEvent, type Remedio } from '../api/client';
import { NotificationService } from '../services/NotificationService';

interface StoreState {
  token: string | null;
  user: Usuario | null;
  produtos: Produto[];
  ambientes: Ambiente[];
  membros: Membro[];
  eventos: Evento[];
  inboxEvents: InboxEvent[];
  remedios: Remedio[];
  insight: Insight | null;
  loading: boolean;
  loadingInbox: boolean;
  theme: 'light' | 'dark';
  
  setAuth: (token: string, user: Usuario) => void;
  logout: () => void;
  fetchProdutos: () => Promise<void>;
  fetchAmbientes: () => Promise<void>;
  fetchMembros: () => Promise<void>;
  fetchEventos: () => Promise<void>;
  fetchInboxEvents: () => Promise<void>;
  fetchRemedios: () => Promise<void>;
  fetchInsight: () => Promise<void>;
  deletarInboxEvent: (id: string) => Promise<void>;
  toggleTheme: () => void;
  alterarQuantidade: (produtoId: number, delta: number) => Promise<void>;
  adicionarProduto: (produto: Omit<Produto, 'id' | 'casa_id'>) => Promise<void>;
  removerProduto: (produtoId: number) => Promise<void>;
  marcarComoComprado: (produto: Produto) => Promise<void>;
  adicionarAmbiente: (ambiente: Omit<Ambiente, 'id' | 'casa_id'>) => Promise<void>;
  removerAmbiente: (ambienteId: number) => Promise<void>;
  adicionarEvento: (evento: { titulo: string, data: string, is_all_day?: boolean }) => Promise<void>;
  editarEvento: (id: string, evento: { titulo?: string, data?: string, is_all_day?: boolean }) => Promise<void>;
  excluirEvento: (id: string) => Promise<void>;
  concluirEvento: (id: string, tituloAtual: string) => Promise<void>;
  adicionarRemedio: (remedio: Omit<Remedio, 'id' | 'casa_id' | 'timestamp' | 'ativo'>) => Promise<void>;
  toggleRemedio: (id: number) => Promise<void>;
  removerRemedio: (id: number) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  token: localStorage.getItem('aurora-token'),
  user: localStorage.getItem('aurora-user') ? JSON.parse(localStorage.getItem('aurora-user')!) : null,
  produtos: [],
  ambientes: [],
  membros: [],
  eventos: [],
  inboxEvents: [],
  remedios: [],
  insight: null,
  loading: false,
  loadingInbox: false,
  theme: (localStorage.getItem('aurora-theme') as 'light' | 'dark') || 'light',

  setAuth: (token, user) => {
    localStorage.setItem('aurora-token', token);
    localStorage.setItem('aurora-user', JSON.stringify(user));
    set({ token, user });
    get().fetchProdutos();
    get().fetchAmbientes();
    get().fetchMembros();
    get().fetchEventos();
    get().fetchRemedios();
    get().fetchInsight();
  },

  logout: () => {
    localStorage.removeItem('aurora-token');
    localStorage.removeItem('aurora-user');
    set({ token: null, user: null, produtos: [], ambientes: [], membros: [], eventos: [], inboxEvents: [], remedios: [], insight: null });
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
  fetchEventos: async () => {
    try {
      const eventos = await getEventos();
      set({ eventos });
    } catch (error) {
      console.error('Error fetching eventos:', error);
    }
  },

  fetchRemedios: async () => {
    try {
      const remedios = await getRemedios();
      set({ remedios });
    } catch (error) {
      console.error('Error fetching remedios:', error);
    }
  },
  fetchInboxEvents: async () => {
    set({ loadingInbox: true });
    try {
      const data = await getInboxEvents();
      set({ inboxEvents: Array.isArray(data) ? data : [], loadingInbox: false });
    } catch (e) {
      console.error(e);
      set({ inboxEvents: [], loadingInbox: false });
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
  deletarInboxEvent: async (id: string) => {
    try {
      // API call logic would go here
      set((state) => ({ inboxEvents: state.inboxEvents.filter(e => e.id !== id) }));
    } catch (error) {
      console.error('Error deleting inbox event:', error);
      throw error;
    }
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('aurora-theme', newTheme);
      return { theme: newTheme };
    });
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
  },
  adicionarEvento: async (evento) => {
    try {
      await createGoogleEvent(evento);
      await get().fetchEventos();
    } catch (e) {
      console.error('Erro ao adicionar evento:', e);
      throw e;
    }
  },
  editarEvento: async (id, evento) => {
    try {
      await updateGoogleEvent(id, evento);
      await get().fetchEventos();
    } catch (e) {
      console.error('Erro ao editar evento:', e);
      throw e;
    }
  },
  excluirEvento: async (id) => {
    const { eventos } = get();
    set({ eventos: eventos.filter(e => e.id !== id) });
    try {
      await deleteGoogleEvent(id);
    } catch (e) {
      console.error('Erro ao excluir evento:', e);
      get().fetchEventos();
      throw e;
    }
  },
  concluirEvento: async (id, tituloAtual) => {
    try {
      await updateGoogleEvent(id, { titulo: `✅ ${tituloAtual}` });
      get().fetchEventos();
    } catch (error) {
      console.error('Error completing google event:', error);
    }
  },

  adicionarRemedio: async (remedio) => {
    try {
      await createRemedio(remedio);
      get().fetchRemedios();
    } catch (error) {
      console.error('Error adding remedio:', error);
      throw error;
    }
  },

  toggleRemedio: async (id) => {
    try {
      // Optimistic update
      set(state => ({
        remedios: state.remedios.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r)
      }));
      await toggleRemedioApi(id);
    } catch (error) {
      console.error('Error toggling remedio:', error);
      get().fetchRemedios(); // revert on fail
      throw error;
    }
  },

  removerRemedio: async (id) => {
    try {
      await deleteRemedio(id);
      get().fetchRemedios();
    } catch (error) {
      console.error('Error removing remedio:', error);
      throw error;
    }
  }
}));
