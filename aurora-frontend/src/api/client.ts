import axios from 'axios';

// Se a variável existir (Deploy Vercel), usa ela. Se não, usa localhost (Dev Local)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aurora-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface Produto {
  id: number;
  casa_id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  quantidade_minima: number;
  ambiente_id?: number;
  validade?: string;
}

export interface Ambiente {
  id: number;
  casa_id: number;
  nome: string;
  icone: string;
}

export const registerUser = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const getProdutos = async (): Promise<Produto[]> => {
  try {
    const response = await api.get<Produto[]>(`/produtos/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching produtos:', error);
    return [];
  }
};

export const updateProduto = async (produtoId: number, data: Partial<Produto>) => {
  try {
    const response = await api.put<Produto>(`/produtos/${produtoId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating produto:', error);
    throw error;
  }
};

export const createProduto = async (data: Omit<Produto, 'id' | 'casa_id'>) => {
  try {
    const response = await api.post<Produto>('/produtos/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating produto:', error);
    throw error;
  }
};

export const deleteProduto = async (produtoId: number) => {
  try {
    const response = await api.delete(`/produtos/${produtoId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting produto:', error);
    throw error;
  }
};

export const getAmbientes = async (): Promise<Ambiente[]> => {
  try {
    const response = await api.get<Ambiente[]>(`/ambientes`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching ambientes:', error);
    return [];
  }
};

export const createAmbiente = async (data: Omit<Ambiente, 'id' | 'casa_id'>) => {
  try {
    const response = await api.post<Ambiente>(`/ambientes`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating ambiente:', error);
    throw error;
  }
};

export const deleteAmbiente = async (ambienteId: number) => {
  try {
    const response = await api.delete(`/ambientes/${ambienteId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting ambiente:', error);
    throw error;
  }
};

export interface Insight {
  tipo: 'sucesso' | 'alerta' | 'info';
  mensagem: string;
}

export const getInsights = async () => {
  try {
    const response = await api.get<Insight>(`/ai/insights`);
    return response.data;
  } catch (error) {
    console.error('Error fetching insights:', error);
    return null;
  }
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  resposta: string;
}

export const sendChatMessage = async (mensagem: string, historico: ChatMessage[] = []): Promise<string> => {
  try {
    const response = await api.post<ChatResponse>('/ai/chat', {
      mensagem,
      historico
    });
    return response.data.resposta;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export interface Membro {
  id: number;
  usuario_id: number;
  casa_id: number;
  permissao: string;
  usuario: {
    nome: string;
    email: string;
  }
}

export interface Convite {
  codigo: string;
  expiracao: string;
}

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  link_meet?: string;
  origem: string;
}

export const getEventos = async (): Promise<Evento[]> => {
  try {
    const response = await api.get<{eventos: Evento[]}>('/connect/google/events');
    return Array.isArray(response.data.eventos) ? response.data.eventos : [];
  } catch (error) {
    console.error('Error fetching eventos:', error);
    return [];
  }
};

export const getMembros = async (): Promise<Membro[]> => {
  try {
    const response = await api.get<Membro[]>('/casas/membros');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching membros:', error);
    return [];
  }
};

export const gerarConvite = async (): Promise<Convite> => {
  const response = await api.post<Convite>('/casas/convite');
  return response.data;
};

export const entrarEmCasa = async (codigo: string): Promise<any> => {
  const response = await api.post('/casas/entrar', { codigo });
  return response.data;
};
