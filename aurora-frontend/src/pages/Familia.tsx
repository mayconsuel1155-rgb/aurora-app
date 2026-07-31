import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Copy, Check, RefreshCw, Key, Link as LinkIcon, Trash2 } from 'lucide-react';
import { gerarConvite } from '../api/client';

export default function Familia() {
  const { membros, fetchMembros, removerMembro, user } = useStore();
  const [codigoConvite, setCodigoConvite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  // Use email for comparison to avoid bugs with legacy mock ID 1 in localStorage
  const currentUserIsAdmin = membros.find(m => m.permissao === 'admin')?.email === user?.email;

  const handleRemover = async (id: number) => {
    if (window.confirm("Deseja realmente remover este membro da casa? Ele perderá acesso imediato.")) {
      try {
        await removerMembro(id);
      } catch (e: any) {
        alert(e.response?.data?.detail || "Erro ao remover membro.");
      }
    }
  };

  useEffect(() => {
    fetchMembros();
  }, [fetchMembros]);

  const handleGerarConvite = async () => {
    setLoading(true);
    setErro('');
    try {
      const convite = await gerarConvite();
      setCodigoConvite(convite.codigo);
      setCopiado(false);
    } catch (e: any) {
      setErro(e.response?.data?.detail || 'Erro ao gerar convite.');
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = () => {
    if (codigoConvite) {
      navigator.clipboard.writeText(codigoConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const copiarLink = () => {
    if (codigoConvite) {
      const link = `${window.location.origin}/register?invite=${codigoConvite}`;
      navigator.clipboard.writeText(link);
      setCopiado(true); // Reusing the state for visual feedback
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-10">
        <div>
          <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Membros</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center">
            Minha Família
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)]">
            Gerencie as pessoas que têm acesso à sua Casa Digital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="saas-card p-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Moradores da Casa</h3>
            
            {membros.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Users className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">Você é o único morador por enquanto.</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Gere um convite ao lado para adicionar familiares.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {membros.map((membro) => (
                  <li key={membro.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-smooth group">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${membro.permissao === 'admin' ? 'bg-blue-600 shadow-md shadow-blue-500/30' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        {membro.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{membro.nome} {membro.id === user?.id ? '(Você)' : ''}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{membro.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold ${membro.permissao === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {membro.permissao === 'admin' ? 'Dono' : 'Convidado'}
                      </span>
                      {currentUserIsAdmin && membro.email !== user?.email && (
                        <button
                          onClick={() => handleRemover(membro.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover morador"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="saas-card p-8 bg-slate-50 dark:bg-slate-900 border-none relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center mb-2 tracking-tight">
              <Key className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
              Convidar Morador
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Gere um código seguro de 6 dígitos. Seu familiar deve inseri-lo no momento do cadastro para entrar na sua casa.
            </p>
            
            {erro && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 mb-4">
                {erro}
              </div>
            )}

            {codigoConvite ? (
              <div className="space-y-4 relative z-10">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center relative">
                  <span className="text-[11px] text-blue-500 font-bold uppercase tracking-widest mb-2">Código Gerado</span>
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] font-mono">
                    {codigoConvite}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={copiarCodigo}
                    className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all active:scale-[0.98] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm text-sm"
                  >
                    {copiado ? <Check size={16} className="mr-2 text-green-500" /> : <Copy size={16} className="mr-2" />}
                    Copiar
                  </button>
                  <button
                    onClick={copiarLink}
                    className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-bold transition-all active:scale-[0.98] bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 shadow-sm text-sm"
                  >
                    {copiado ? <Check size={16} className="mr-2 text-green-500" /> : <LinkIcon size={16} className="mr-2" />}
                    Copiar Link
                  </button>
                </div>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">Envie o link para a pessoa. Válido por 24h.</p>
              </div>
            ) : (
              <button
                onClick={handleGerarConvite}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-bold text-white btn-primary shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] disabled:opacity-70 group"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <>
                    Gerar Novo Código
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
