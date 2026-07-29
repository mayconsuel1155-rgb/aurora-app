import { create } from 'zustand';
import { getProdutos, getInsights, updateProduto, createProduto, deleteProduto, getAmbientes, createAmbiente, deleteAmbiente, getMembros, getEventos, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, getInboxEvents, type Produto, type Insight, type Ambiente, type Usuario, type Membro, type Evento, type InboxEvent } from '../api/client';
import { NotificationService } from '../services/NotificationService';

interface StoreState {
  token: string | null;
  user: Usuario | null;
  produtos: Produto[];
  ambientes: Ambiente[];
  membros: Membro[];
  eventos: Evento[];
  inboxEvents: InboxEvent[];
  insight: Insight | null;
  loading: boolean;
  loadingInbox: boolean;
  
  setAuth: (token: string, user: Usuario) => void;
  logout: () => void;
  fetchProdutos: () => Promise<void>;
  fetchAmbientes: () => Promise<void>;
  fetchMembros: () => Promise<void>;
  fetchEventos: () => Promise<void>;
  fetchInboxEvents: () => Promise<void>;
  fetchInsight: () => Promise<void>;
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
}

export const useStore = create<StoreState>((set, get) => ({
  token: localStorage.getItem('aurora-token'),
  user: localStorage.getItem('aurora-user') ? JSON.parse(localStorage.getItem('aurora-user')!) : null,
  produtos: [],
  ambientes: [],
  membros: [],
  eventos: [],
  inboxEvents: [],
  insight: null,
  loading: false,
  loadingInbox: false,

  setAuth: (token, user) => {
    localStorage.setItem('aurora-token', token);
    localStorage.setItem('aurora-user', JSON.stringify(user));
    set({ token, user });
    get().fetchProdutos();
    get().fetchAmbientes();
    get().fetchMembros();
    get().fetchEventos();
    get().fetchInsight();
  },

  logout: () => {
    localStorage.removeItem('aurora-token');
    localStorage.removeItem('aurora-user');
    set({ token: null, user: null, produtos: [], ambientes: [], membros: [], eventos: [], inboxEvents: [], insight: null });
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
      const data = await getEventos();
      set({ eventos: Array.isArray(data) ? data : [] });
    } catch (e) {
      console.error(e);
      set({ eventos: [] });
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
      await updateGoogleEvent(id, { titulo: `[Concluído] ${tituloAtual}` });
      await get().fetchEventos();
    } catch (e) {
      console.error('Erro ao concluir evento:', e);
      throw e;
    }
  }
}));
