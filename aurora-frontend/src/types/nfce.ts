import type { Produto } from '../api/client';

export interface NfceItemPreview {
  indice: number;
  nome: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  valor_total: number;
  produto_id?: number;
}

export interface NfcePreview {
  chave_acesso: string;
  uf: string;
  emitente?: string;
  valor_total?: number;
  consulta_portal: string;
  consulta_tentativas: number;
  retry_after_seconds: number;
  itens: NfceItemPreview[];
}

export interface NfceReviewItem extends NfceItemPreview {
  selecionado: boolean;
  categoria: string;
}

export interface NfceImportResult {
  atualizados: number;
  criados: number;
  produtos: Produto[];
}

export interface NfceHistoryItem extends NfceItemPreview {
  importado_estoque: boolean;
}

export interface NfceAccessKeyResult {
  chave_acesso: string;
  uf: string;
  importada: boolean;
  emitente?: string;
  valor_total?: number;
  importada_em?: string;
  itens: NfceHistoryItem[];
  consulta_automatica_disponivel: boolean;
  mensagem: string;
}

export interface NfceRateLimit {
  message: string;
  portal: string;
  attempts: number;
  retry_after_seconds: number;
}
