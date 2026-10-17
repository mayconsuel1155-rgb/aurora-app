import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Copy, Check, RefreshCw, Key, Link as LinkIcon, Trash2 } from 'lucide-react';
import { gerarConvite, getApiErrorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Familia() {
  const { membros, fetchMembros, removerMembro, user } = useStore();
  const [codigoConvite, setCodigoConvite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');
  const [membroParaRemover, setMembroParaRemover] = useState<{ id: number; nome: string } | null>(null);

  // Use email for comparison to avoid bugs with legacy mock ID 1 in localStorage
  const currentUserIsAdmin = membros.find(m => m.permissao === 'admin')?.email === user?.email;

  const handleRemover = async () => {
    if (!membroParaRemover) return;
    setErro('');
    try {
      await removerMembro(membroParaRemover.id);
      setMembroParaRemover(null);
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível remover o morador.'));
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
    } catch (error: unknown) {
      setErro(getApiErrorMessage(error, 'Não foi possível gerar o convite.'));
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
    <div className="page-stack">
      <PageHeader
        eyebrow="Família"
        title="Pessoas da casa"
        description="Gerencie quem pode acessar e atualizar as informações compartilhadas."
      />

      {erro && <div role="alert" className="status-danger rounded-xl border border-current/15 p-4 text-sm font-medium">{erro}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aurora-panel p-6">
            <h3 className="section-title mb-6">Moradores</h3>
            
            {membros.length === 0 ? (
              <div className="empty-state min-h-64">
                <span className="empty-state-icon mb-3"><Users aria-hidden="true" size={22} /></span>
                <p className="text-sm font-semibold">Somente você tem acesso no momento.</p>
                <p className="section-copy">Crie um convite para adicionar outra pessoa.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {membros.map((membro) => (
                  <li key={membro.id} className="render-item group flex items-center justify-between rounded-xl border border-[var(--color-aurora-border)] p-3 transition-colors hover:bg-[var(--color-aurora-soft)]">
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
                          onClick={() => setMembroParaRemover({ id: membro.id, nome: membro.nome })}
                          className="p-1.5 text-[#A1A1AA] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                          title="Remover morador"
                          aria-label={`Remover ${membro.nome}`}
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
          <div className="aurora-panel p-6">
            
            <h3 className="text-sm font-bold text-[#171717] dark:text-[#EDEDED] flex items-center mb-1 tracking-tight">
              <Key className="mr-2 text-[#171717] dark:text-[#EDEDED]" size={16} />
              Convidar pessoa
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#A1A1AA] mb-6">
              Gere um código de 6 dígitos para outra pessoa usar ao criar a conta.
            </p>
            
            {erro && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 mb-4">
                {erro}
              </div>
            )}

            {codigoConvite ? (
              <div className="space-y-3 relative z-10">
                <div className="bg-white dark:bg-[#111111] rounded-lg p-4 border border-[#EAEAEA] dark:border-[#262626] flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[#666666] dark:text-[#A1A1AA] font-bold uppercase tracking-widest mb-1">Código do convite</span>
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
                <p className="text-[10px] text-center text-[#666666] dark:text-[#A1A1AA] mt-2">Válido por 24 horas.</p>
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

      <ConfirmDialog
        isOpen={Boolean(membroParaRemover)}
        title="Remover morador"
        description={`${membroParaRemover?.nome ?? 'Esta pessoa'} perderá o acesso imediato às informações da casa.`}
        confirmLabel="Remover"
        onConfirm={handleRemover}
        onCancel={() => setMembroParaRemover(null)}
      />
    </div>
  );
}
