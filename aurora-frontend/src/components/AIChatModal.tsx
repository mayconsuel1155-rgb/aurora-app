import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, RefreshCw, MessageSquare, Clock } from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../api/client';


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
      content: 'Olá! Sou a IA Aurora, sua assistente doméstica. Como posso ajudar com a sua casa hoje?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isDelayed]);

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
    } catch (error: any) {
      console.error(error);
      const motivo = error?.response?.data?.detail || error?.message || 'Oscilação de conexão ou instabilidade nos servidores da OpenRouter';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ A IA Aurora não está conseguindo responder no momento.\nMotivo: ${motivo}`
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
        content: 'Histórico reiniciado. Como posso ajudar você agora?'
      }
    ]);
  };

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[600px] z-50 flex flex-col bg-white/95 backdrop-blur-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-[var(--color-aurora-primary)] via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
            <Sparkles size={22} className="text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">IA Aurora</h3>
            <p className="text-xs text-indigo-100/90 font-light">Assistente Doméstica Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLimparHistorico}
            title="Limpar Conversa"
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <RefreshCw size={17} />
          </button>
          <button
            onClick={onClose}
            title="Fechar Chat"
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-2xl shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-indigo-100 text-[var(--color-aurora-primary)]'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--color-aurora-primary)] text-white rounded-tr-none shadow-sm'
                  : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-2xl bg-indigo-100 text-[var(--color-aurora-primary)] shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-4 bg-white rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>

            {isDelayed && (
              <div className="flex items-start space-x-2.5 text-xs bg-amber-50/90 text-amber-900 border border-amber-200/90 p-3 rounded-2xl shadow-xs animate-in fade-in slide-in-from-top-1 duration-300">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5 animate-spin" />
                <div className="leading-snug">
                  <span className="font-semibold block text-amber-950 mb-0.5">Notificação de Atraso</span>
                  A IA Aurora está demorando a responder devido à alta demanda/latência nos servidores do provedor de modelos. Aguarde mais um instante...
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MessageSquare size={12} /> Sugestões de perguntas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGESTOES_INICIAIS.map((sugestao, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sugestao)}
                className="text-xs bg-white text-slate-700 hover:bg-indigo-50 hover:text-[var(--color-aurora-primary)] border border-slate-200/80 px-2.5 py-1.5 rounded-xl transition-all text-left shadow-2xs"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo sobre a sua casa..."
          disabled={loading}
          className="flex-1 bg-slate-100 text-slate-800 placeholder-slate-400 text-sm px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-aurora-primary)]/40 transition-all disabled:opacity-60"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || loading}
          className="p-3 bg-[var(--color-aurora-primary)] text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-2xl transition-all shadow-md active:scale-95 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
