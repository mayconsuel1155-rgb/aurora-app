import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Users, Copy, Check, RefreshCw, Key } from 'lucide-react';
import { gerarConvite } from '../api/client';

export default function Familia() {
  const { membros, fetchMembros, user } = useStore();
  const [codigoConvite, setCodigoConvite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-aurora-text)] flex items-center">
            <Users className="mr-3 text-[var(--color-aurora-primary)]" size={32} />
            Minha Família
          </h2>
          <p className="mt-2 text-[var(--color-aurora-text-muted)]">
            Gerencie as pessoas que têm acesso à sua Casa Digital.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aurora-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--color-aurora-text)] mb-4">Membros da Casa</h3>
            
            {membros.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Você é o único morador por enquanto.</p>
                <p className="text-sm text-slate-400 mt-1">Gere um convite ao lado para adicionar familiares.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {membros.map((membro) => (
                  <li key={membro.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${membro.permissao === 'admin' ? 'bg-gradient-to-tr from-[var(--color-aurora-primary)] to-purple-400 shadow-md shadow-indigo-200' : 'bg-slate-300'}`}>
                        {membro.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-slate-800">{membro.nome} {membro.id === user?.id ? '(Você)' : ''}</p>
                        <p className="text-xs text-slate-500">{membro.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${membro.permissao === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                        {membro.permissao === 'admin' ? 'Dono' : 'Convidado'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="aurora-card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/40 rounded-full blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
            
            <h3 className="text-lg font-semibold text-[var(--color-aurora-text)] flex items-center mb-2">
              <Key className="mr-2 text-[var(--color-aurora-primary)]" size={20} />
              Convidar Morador
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Gere um código seguro de 6 dígitos. Seu familiar deve inseri-lo no momento do cadastro para entrar na sua casa.
            </p>
            
            {erro && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 mb-4">
                {erro}
              </div>
            )}

            {codigoConvite ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-indigo-100 flex flex-col items-center justify-center relative">
                  <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">Código Gerado</span>
                  <span className="text-3xl font-extrabold text-[var(--color-aurora-primary)] tracking-widest font-mono">
                    {codigoConvite}
                  </span>
                </div>
                
                <button
                  onClick={copiarCodigo}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all active:scale-[0.98] bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm"
                >
                  {copiado ? <Check size={18} className="mr-2 text-green-500" /> : <Copy size={18} className="mr-2" />}
                  {copiado ? 'Copiado!' : 'Copiar Código'}
                </button>
                <p className="text-xs text-center text-slate-500 mt-2">Válido por 24 horas.</p>
              </div>
            ) : (
              <button
                onClick={handleGerarConvite}
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200/50 text-sm font-medium text-white bg-[var(--color-aurora-primary)] hover:bg-[var(--color-aurora-primary-hover)] transition-all active:scale-[0.98] disabled:opacity-70 group"
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
