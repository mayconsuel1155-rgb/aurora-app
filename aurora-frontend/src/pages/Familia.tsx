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
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="ui-label ui-label-gray mb-3">Família</span>
          <h2 className="text-3xl font-bold text-[#171717] dark:text-[#EDEDED] tracking-tight">
            Minha Família
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)]">
            Gerencie as pessoas que têm acesso à sua Casa Digital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aurora-card p-6">
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#EDEDED] mb-6 tracking-tight">Moradores</h3>
            
            {membros.length === 0 ? (
              <div className="py-10 text-center bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-lg border border-dashed border-[#EAEAEA] dark:border-[#262626]">
                <Users className="mx-auto h-10 w-10 text-[#A1A1AA] dark:text-[#666666] mb-3" />
                <p className="text-[#171717] dark:text-[#EDEDED] font-medium text-sm">Você é o único morador por enquanto.</p>
                <p className="text-[#666666] dark:text-[#A1A1AA] text-xs mt-1">Gere um convite ao lado para adicionar familiares.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {membros.map((membro) => (
                  <li key={membro.id} className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-[#EAEAEA] dark:border-[#262626] hover:bg-[#FAFAFA] dark:hover:bg-[#111111] transition-smooth group">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${membro.permissao === 'admin' ? 'bg-[#171717] text-white border-[#000000] dark:bg-[#EDEDED] dark:text-black' : 'bg-[#FAFAFA] text-[#666666] border-[#EAEAEA] dark:bg-[#171717] dark:border-[#262626] dark:text-[#A1A1AA]'}`}>
                        {membro.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-[#171717] dark:text-[#EDEDED]">{membro.nome} {membro.id === user?.id ? <span className="text-[#666666] dark:text-[#A1A1AA] font-normal">(Você)</span> : ''}</p>
                        <p className="text-[10px] text-[#666666] dark:text-[#A1A1AA]">{membro.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="ui-label ui-label-gray">
                        {membro.permissao === 'admin' ? 'Dono' : 'Convidado'}
                      </span>
                      {currentUserIsAdmin && membro.email !== user?.email && (
                        <button
                          onClick={() => handleRemover(membro.id)}
                          className="p-1.5 text-[#A1A1AA] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                          title="Remover morador"
                        >
                          <Trash2 size={14} />
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
          <div className="aurora-card p-6 bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            
            <h3 className="text-sm font-bold text-[#171717] dark:text-[#EDEDED] flex items-center mb-1 tracking-tight">
              <Key className="mr-2 text-[#171717] dark:text-[#EDEDED]" size={16} />
              Convidar Morador
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#A1A1AA] mb-6">
              Gere um código seguro de 6 dígitos. Seu familiar deve inseri-lo no cadastro.
            </p>
            
            {erro && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 mb-4">
                {erro}
              </div>
            )}

            {codigoConvite ? (
              <div className="space-y-3 relative z-10">
                <div className="bg-white dark:bg-[#111111] rounded-lg p-4 border border-[#EAEAEA] dark:border-[#262626] flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[#666666] dark:text-[#A1A1AA] font-bold uppercase tracking-widest mb-1">Código Gerado</span>
                  <span className="text-2xl font-mono font-bold text-[#171717] dark:text-[#EDEDED] tracking-[0.2em]">
                    {codigoConvite}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={copiarCodigo}
                    className="flex-1 btn-primary py-2 px-3 text-xs"
                  >
                    {copiado ? <Check size={14} className="inline mr-1" /> : <Copy size={14} className="inline mr-1" />}
                    Copiar
                  </button>
                  <button
                    onClick={copiarLink}
                    className="flex-1 btn-outline py-2 px-3 text-xs bg-white dark:bg-[#0A0A0A]"
                  >
                    {copiado ? <Check size={14} className="inline mr-1 text-green-500" /> : <LinkIcon size={14} className="inline mr-1" />}
                    Link
                  </button>
                </div>
                <p className="text-[10px] text-center text-[#666666] dark:text-[#A1A1AA] mt-2">Válido por 24h.</p>
              </div>
            ) : (
              <button
                onClick={handleGerarConvite}
                disabled={loading}
                className="w-full btn-primary py-2.5 px-4 flex justify-center items-center"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={16} />
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
