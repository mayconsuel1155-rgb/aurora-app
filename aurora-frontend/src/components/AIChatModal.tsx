import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, RefreshCw, MessageSquare, Clock } from 'lucide-react';
import { getApiErrorMessage, sendChatMessage, type ChatMessage } from '../api/client';


interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGESTOES_INICIAIS = [
  "O que precisamos repor no estoque?",
  "Temos café na despensa?",
  "O que posso preparar com os produtos que temos?",
  "Faça um resumo da saúde da casa hoje."
];

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá. Posso ajudar com o estoque, a agenda e outras informações da casa. O que você precisa?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isDelayed]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    if (!textToSend) setInputMessage('');
    setLoading(true);
    setIsDelayed(false);

    // Timer para notificar sobre atraso caso a IA demore mais de 4 segundos para responder
    const delayTimer = setTimeout(() => {
      setIsDelayed(true);
    }, 4000);

    try {
      // Enviar histórico excluindo a mensagem inicial de boas-vindas para economizar tokens
      const historicoRelevante = updatedMessages.filter((_, idx) => idx > 0);
      const resposta = await sendChatMessage(text, historicoRelevante);

      setMessages(prev => [...prev, { role: 'assistant', content: resposta }]);
    } catch (error: unknown) {
      console.error(error);
      const motivo = getApiErrorMessage(error, 'Oscilação de conexão ou instabilidade no provedor');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `A IA Aurora não está conseguindo responder no momento.\nMotivo: ${motivo}`
        }
      ]);
    } finally {
      clearTimeout(delayTimer);
      setIsDelayed(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLimparHistorico = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversa reiniciada. O que você gostaria de consultar?'
      }
    ]);
  };

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="ai-chat-title" className="fixed inset-0 z-[70] flex flex-col overflow-hidden border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] shadow-[var(--shadow-float)] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(600px,calc(100dvh-3rem))] sm:w-[420px] sm:rounded-2xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-[var(--color-aurora-primary)] p-4 text-white md:p-5">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-white/12 p-2.5">
            <Sparkles aria-hidden="true" size={22} className="text-[var(--color-aurora-accent)]" />
          </div>
          <div>
            <h2 id="ai-chat-title" className="text-base font-bold leading-tight">IA Aurora</h2>
            <p className="text-xs font-light text-white/68">Assistente doméstica inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLimparHistorico}
            aria-label="Limpar conversa"
            className="rounded-lg p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw aria-hidden="true" size={17} />
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar chat"
            className="rounded-lg p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto bg-[var(--color-aurora-bg)] p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`render-item flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-2xl shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'surface-primary-soft'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--color-aurora-primary)] text-white rounded-tr-none shadow-sm'
                  : 'rounded-tl-none border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] text-[var(--color-aurora-text)] shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="surface-primary-soft shrink-0 rounded-xl p-2">
                <Bot size={16} />
              </div>
              <div className="flex items-center space-x-2 rounded-2xl rounded-tl-none border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-4 shadow-sm">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-aurora-primary)]" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-aurora-primary)]" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-aurora-primary)]" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            {isDelayed && (
              <div className="status-warning flex items-start space-x-2.5 rounded-xl border border-current/15 p-3 text-xs">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5 animate-spin" />
                <div className="leading-snug">
                  <span className="font-semibold block text-amber-950 mb-0.5">A resposta está demorando</span>
                  A IA Aurora está demorando a responder devido à latência do provedor. Aguarde mais um instante…
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && !loading && (
        <div className="shrink-0 border-t border-[var(--color-aurora-border)] bg-[var(--color-aurora-soft)] px-4 py-2">
          <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--color-aurora-text-muted)]">
            <MessageSquare aria-hidden="true" size={12} /> Sugestões de perguntas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGESTOES_INICIAIS.map((sugestao, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sugestao)}
                className="rounded-lg border border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] px-2.5 py-1.5 text-left text-xs text-[var(--color-aurora-text)] transition-[color,background-color,border-color] hover:border-[var(--color-aurora-primary)] hover:text-[var(--color-aurora-primary)]"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="flex shrink-0 items-center space-x-2 border-t border-[var(--color-aurora-border)] bg-[var(--color-aurora-surface)] p-3">
        <input
          ref={inputRef}
          id="ai-message"
          name="mensagem"
          aria-label="Mensagem para a IA Aurora"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder="Pergunte algo sobre a sua casa…"
          disabled={loading}
          className="form-input min-w-0 flex-1 text-sm disabled:opacity-60"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || loading}
          type="button"
          aria-label="Enviar mensagem"
          className="shrink-0 rounded-xl bg-[var(--color-aurora-primary)] p-3 text-white shadow-md transition-[background-color,transform] hover:bg-[var(--color-aurora-primary-hover)] active:scale-95 disabled:bg-[var(--color-aurora-soft)] disabled:text-[var(--color-aurora-text-muted)]"
        >
          <Send aria-hidden="true" size={18} />
        </button>
      </div>
    </section>
  );
}
