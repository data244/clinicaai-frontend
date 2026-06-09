'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminApi, convitesApi, releasesApi, Release, ContaAdmin } from '@/lib/api'
import { ShieldCheck, ShieldAlert, Loader2, Check, Ban, Lock, KeyRound, Copy, X, Trash2, Link2, Gift, Megaphone, Plus, Globe, EyeOff } from 'lucide-react'

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  ativo:              { label: 'Ativo',       cls: 'bg-green-50 text-green-700 border-green-200' },
  pendente_pagamento: { label: 'Aguardando',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspenso:           { label: 'Suspenso',    cls: 'bg-red-50 text-red-700 border-red-200' },
  trial:              { label: 'Teste',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function AdminPage() {
  const [contas, setContas] = useState<ContaAdmin[]>([])
  const [filtro, setFiltro] = useState<'pendente_pagamento' | ''>('pendente_pagamento')
  const [loading, setLoading] = useState(true)
  const [restrito, setRestrito] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)
  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; senha: string } | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Convites beta
  type Convite = { id: string; token: string; link: string; criado_por?: string; usado_por?: string; usado: boolean; usado_em?: string; expires_at: string; created_at: string }
  const [convites, setConvites] = useState<Convite[]>([])
  const [loadingConvites, setLoadingConvites] = useState(false)
  const [gerandoConvite, setGerandoConvite] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  // Releases / Changelog
  const [releases, setReleases] = useState<Release[]>([])
  const [loadingReleases, setLoadingReleases] = useState(false)
  const [criarRelease, setCriarRelease] = useState(false)
  const [salvandoRelease, setSalvandoRelease] = useState(false)
  const [novaRelease, setNovaRelease] = useState({ versao: '', titulo: '', notas: '', publico: true })

  const carregarReleases = async () => {
    setLoadingReleases(true)
    try {
      const r = await releasesApi.listarAdmin()
      setReleases(r.releases)
    } catch { /* ignore */ }
    finally { setLoadingReleases(false) }
  }

  const salvarRelease = async () => {
    if (!novaRelease.versao || !novaRelease.titulo || !novaRelease.notas) return
    setSalvandoRelease(true)
    try {
      await releasesApi.criar(novaRelease)
      setNovaRelease({ versao: '', titulo: '', notas: '', publico: true })
      setCriarRelease(false)
      await carregarReleases()
    } catch (e: unknown) {
      alert((e as Error).message || 'Erro ao salvar release.')
    } finally { setSalvandoRelease(false) }
  }

  const deletarRelease = async (id: string) => {
    if (!confirm('Apagar esta versão do changelog?')) return
    try {
      await releasesApi.deletar(id)
      setReleases(prev => prev.filter(r => r.id !== id))
    } catch (e: unknown) {
      alert((e as Error).message || 'Erro ao apagar release.')
    }
  }

  const toggleAdmin = async (c: ContaAdmin) => {
    const acao = c.is_admin ? 'remover admin de' : 'tornar admin'
    if (!confirm(`Deseja ${acao} "${c.nome || c.email}"?`)) return
    setProcessando(c.id)
    try {
      const r = await adminApi.toggleAdmin(c.id)
      setContas(prev => prev.map(x => x.id === c.id ? { ...x, is_admin: r.is_admin } : x))
    } catch {
      alert('Não foi possível alterar o status admin.')
    } finally {
      setProcessando(null)
    }
  }

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.listarContas(filtro || undefined)
      setContas(res.contas)
      setRestrito(false)
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 403) setRestrito(true)
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { carregarConvites(); carregarReleases() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const alterar = async (id: string, status: string) => {
    setProcessando(id)
    try { await adminApi.alterarStatus(id, status) } finally {
      await carregar(); setProcessando(null)
    }
  }

  const redefinirSenha = async (c: ContaAdmin) => {
    setProcessando(c.id)
    try {
      const r = await adminApi.resetSenha(c.id)
      setSenhaGerada({ nome: c.nome || c.email, senha: r.senha_temporaria })
      setCopiado(false)
    } catch {
      // ignora; admin pode tentar de novo
    } finally {
      setProcessando(null)
    }
  }

  const deletarConta = async (c: ContaAdmin) => {
    if (!confirm(`Deletar a conta de "${c.nome || c.email}"?\n\nEsta ação é irreversível e libera o e-mail para reutilização.`)) return
    setProcessando(c.id)
    try {
      await adminApi.deletarConta(c.id)
      setContas(prev => prev.filter(x => x.id !== c.id))
    } catch {
      alert('Não foi possível deletar a conta.')
    } finally {
      setProcessando(null)
    }
  }

  const carregarConvites = async () => {
    setLoadingConvites(true)
    try {
      const r = await convitesApi.listarAdmin()
      setConvites(r.convites)
    } catch { /* ignore */ }
    finally { setLoadingConvites(false) }
  }

  const gerarConvite = async () => {
    setGerandoConvite(true)
    try {
      await convitesApi.gerar()
      await carregarConvites()
    } catch (e: unknown) {
      alert((e as Error).message || 'Erro ao gerar convite.')
    } finally { setGerandoConvite(false) }
  }

  const apagarConvite = async (id: string) => {
    if (!confirm('Apagar este convite? Esta ação não pode ser desfeita.')) return
    try {
      await convitesApi.apagar(id)
      setConvites(prev => prev.filter(c => c.id !== id))
    } catch (e: unknown) {
      alert((e as Error).message || 'Erro ao apagar convite.')
    }
  }

  const copiarLink = (link: string) => {
    navigator.clipboard?.writeText(link)
    setLinkCopiado(link)
    setTimeout(() => setLinkCopiado(null), 2000)
  }

  if (restrito) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-2xl mb-4">
          <Lock className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Acesso restrito</h1>
        <p className="text-sm text-gray-500">Esta área é exclusiva do administrador.</p>
      </div>
    )
  }

  const fmtData = (s: string) => { try { return new Date(s).toLocaleDateString('pt-BR') } catch { return '' } }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Admin — Contas</h1>
      </div>
      <p className="text-sm text-gray-600 mb-5 ml-12">Libere o acesso de novos profissionais ou redefina a senha de alguém.</p>

      <div className="flex gap-2 mb-4">
        {([['pendente_pagamento', 'Aguardando'], ['', 'Todas']] as const).map(([val, lbl]) => (
          <button
            key={lbl}
            onClick={() => setFiltro(val as 'pendente_pagamento' | '')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === val ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : contas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {filtro ? 'Nenhuma conta aguardando liberação.' : 'Nenhuma conta encontrada.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contas.map(c => {
              const info = STATUS_INFO[c.status_conta] || { label: c.status_conta, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
              const busy = processando === c.id
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nome || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  </div>
                  <div className="hidden md:block text-xs text-gray-400 w-24 shrink-0">{fmtData(c.created_at)}</div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${info.cls} shrink-0`}>{info.label}</span>
                  <div className="flex items-center gap-3 justify-end shrink-0 w-44">
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button onClick={() => toggleAdmin(c)}
                          title={c.is_admin ? 'Remover admin' : 'Tornar admin'}
                          className={c.is_admin ? 'text-indigo-500 hover:text-gray-400 transition-colors' : 'text-gray-400 hover:text-indigo-500 transition-colors'}>
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletarConta(c)} title="Deletar conta"
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => redefinirSenha(c)} title="Redefinir senha"
                          className="text-gray-400 hover:text-indigo-600 transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {c.status_conta === 'ativo' ? (
                          <button onClick={() => alterar(c.id, 'suspenso')}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors">
                            <Ban className="w-3.5 h-3.5" /> Suspender
                          </button>
                        ) : (
                          <button onClick={() => alterar(c.id, 'ativo')}
                            className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                            <Check className="w-3.5 h-3.5" /> Liberar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Seção: Convites Beta */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">Convites Beta</h2>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={gerarConvite}
              disabled={gerandoConvite}
              className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              {gerandoConvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Gerar convite
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {loadingConvites ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
          ) : convites.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Nenhum convite gerado ainda. Clique em "Gerar convite" para criar o primeiro.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {convites.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-500 truncate">{c.link}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Criado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      {c.usado && c.usado_em && ` · Usado em ${new Date(c.usado_em).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    c.usado
                      ? 'bg-gray-50 text-gray-500 border-gray-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {c.usado ? 'Usado' : 'Disponível'}
                  </span>
                  {!c.usado && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copiarLink(c.link)}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {linkCopiado === c.link ? 'Copiado!' : 'Copiar link'}
                      </button>
                      <button
                        onClick={() => apagarConvite(c.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Apagar convite"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Seção: Releases / Changelog */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">Novidades & Changelog</h2>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={() => setCriarRelease(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova versão
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {loadingReleases ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
          ) : releases.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Nenhuma versão registrada ainda. Clique em &quot;Nova versão&quot; para começar.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {releases.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-bold text-indigo-600">v{r.versao}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{r.titulo}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    r.publico
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {r.publico ? <><Globe className="w-3 h-3" /> Público</> : <><EyeOff className="w-3 h-3" /> Privado</>}
                  </span>
                  <button
                    onClick={() => deletarRelease(r.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                    title="Apagar versão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: criar release */}
      {criarRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setCriarRelease(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nova versão</h2>
              <button onClick={() => setCriarRelease(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-32 shrink-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Versão</label>
                  <input
                    value={novaRelease.versao}
                    onChange={e => setNovaRelease(p => ({ ...p, versao: e.target.value }))}
                    placeholder="1.2.0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                  <input
                    value={novaRelease.titulo}
                    onChange={e => setNovaRelease(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ex: Módulo Financeiro lançado"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas (o que mudou)</label>
                <textarea
                  value={novaRelease.notas}
                  onChange={e => setNovaRelease(p => ({ ...p, notas: e.target.value }))}
                  rows={5}
                  placeholder="• Lançamento do módulo financeiro com controle de cobranças&#10;• Correção no calendário da agenda&#10;• Melhoria de performance no copiloto"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaRelease.publico}
                  onChange={e => setNovaRelease(p => ({ ...p, publico: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="text-sm text-gray-700">Visível para todos os usuários</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setCriarRelease(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={salvarRelease}
                disabled={salvandoRelease || !novaRelease.versao || !novaRelease.titulo || !novaRelease.notas}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {salvandoRelease ? 'Salvando...' : 'Publicar versão'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: senha temporária gerada */}
      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSenhaGerada(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Senha temporária</h2>
              <button onClick={() => setSenhaGerada(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Nova senha de <span className="font-medium text-gray-900">{senhaGerada.nome}</span>. Envie a ela e peça para trocar em Configurações depois de entrar.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <code className="flex-1 text-base font-mono text-gray-900 tracking-wide select-all">{senhaGerada.senha}</code>
              <button
                onClick={() => { navigator.clipboard?.writeText(senhaGerada.senha); setCopiado(true) }}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
