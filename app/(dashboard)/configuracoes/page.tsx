'use client'

import { useState, useEffect } from 'react'
import { perfilApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Profissional } from '@/types'
import {
  User, MessageCircle, Lock, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2, Settings, CreditCard, ExternalLink
} from 'lucide-react'

type Tab = 'perfil' | 'whatsapp' | 'pagamentos' | 'conta'

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  const cls = type === 'success'
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-red-50 border-red-200 text-red-800'
  const Icon = type === 'success' ? CheckCircle : AlertCircle
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${cls}`}>
      <Icon className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const { nome: nomeCtx } = useAuth()
  const [tab, setTab] = useState<Tab>('perfil')
  const [perfil, setPerfil] = useState<Profissional | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Perfil
  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [conselho, setConselho] = useState('')
  const [numeroConselho, setNumeroConselho] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bio, setBio] = useState('')

  // WhatsApp
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [evolutionKey, setEvolutionKey] = useState('')
  const [evolutionInstancia, setEvolutionInstancia] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Pagamentos
  const [mpToken, setMpToken] = useState('')
  const [showMpToken, setShowMpToken] = useState(false)
  const [mpTokenSalvo, setMpTokenSalvo] = useState(false)

  // Conta
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)

  useEffect(() => {
    perfilApi.get().then((p) => {
      setPerfil(p)
      setNome(p.nome || '')
      setEspecialidade(p.especialidade || '')
      setConselho(p.conselho || '')
      setNumeroConselho(p.numero_conselho || '')
      setTelefone(p.telefone || '')
      setBio(p.bio || '')
      setEvolutionUrl(p.evolution_api_url || '')
      setEvolutionInstancia(p.evolution_instancia || 'clinicaai')
      if (p.mercadopago_access_token) {
        setMpToken('••••••••••••••••')
        setMpTokenSalvo(true)
      }
    }).finally(() => setLoading(false))
  }, [])

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await perfilApi.update({ nome, especialidade, conselho, numero_conselho: numeroConselho, telefone, bio })
      showFeedback('success', 'Perfil atualizado com sucesso!')
    } catch {
      showFeedback('error', 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function salvarWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updatePayload: {
        evolution_api_url?: string
        evolution_instancia?: string
        evolution_api_key?: string
      } = {
        evolution_api_url: evolutionUrl,
        evolution_instancia: evolutionInstancia,
      }
      if (evolutionKey && !evolutionKey.startsWith('••')) {
        updatePayload.evolution_api_key = evolutionKey
      }
      await perfilApi.update(updatePayload)
      showFeedback('success', 'Configuração WhatsApp salva!')
    } catch {
      showFeedback('error', 'Erro ao salvar configuração WhatsApp.')
    } finally {
      setSaving(false)
    }
  }

  async function salvarPagamentos(e: React.FormEvent) {
    e.preventDefault()
    if (mpToken.startsWith('••')) {
      showFeedback('success', 'Token já está configurado.')
      return
    }
    if (!mpToken.trim()) {
      showFeedback('error', 'Cole o Access Token do Mercado Pago.')
      return
    }
    setSaving(true)
    try {
      await perfilApi.update({ mercadopago_access_token: mpToken.trim() })
      setMpToken('••••••••••••••••')
      setMpTokenSalvo(true)
      showFeedback('success', 'Access Token do Mercado Pago salvo!')
    } catch {
      showFeedback('error', 'Erro ao salvar token do Mercado Pago.')
    } finally {
      setSaving(false)
    }
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      showFeedback('error', 'As senhas não coincidem.')
      return
    }
    if (novaSenha.length < 8) {
      showFeedback('error', 'A senha deve ter pelo menos 8 caracteres.')
      return
    }
    setSaving(true)
    try {
      await perfilApi.changePassword(novaSenha)
      setNovaSenha('')
      setConfirmarSenha('')
      showFeedback('success', 'Senha alterada com sucesso!')
    } catch {
      showFeedback('error', 'Erro ao alterar senha.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
    { id: 'conta', label: 'Conta', icon: Lock },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Gerencie seu perfil e preferências</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setFeedback(null) }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {feedback && <Alert type={feedback.type} msg={feedback.msg} />}

          {tab === 'perfil' && (
            <form onSubmit={salvarPerfil} className="space-y-4">
              <div className="flex items-center gap-4 pb-2">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
                  {nome.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{nome || 'Profissional'}</p>
                  <p className="text-xs text-gray-400">{especialidade || 'Especialidade não definida'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Especialidade</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Ex: Psicologia Clínica" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Conselho</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={conselho} onChange={e => setConselho(e.target.value)} placeholder="CRP / CRM / CRO..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número do conselho</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={numeroConselho} onChange={e => setNumeroConselho(e.target.value)} placeholder="06/12345" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bio / Apresentação</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Breve descrição sobre sua atuação..." />
                </div>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar perfil
              </button>
            </form>
          )}

          {tab === 'whatsapp' && (
            <form onSubmit={salvarWhatsApp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona</p>
                <p className="text-blue-700">Configure sua instância da Evolution API para que o sistema envie lembretes automáticos de consulta via WhatsApp às 08h do dia anterior.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL da Evolution API</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={evolutionUrl} onChange={e => setEvolutionUrl(e.target.value)} placeholder="https://sua-instancia.evolution-api.com" type="url" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">API Key</label>
                <div className="relative">
                  <input className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={evolutionKey} onChange={e => setEvolutionKey(e.target.value)} placeholder="Deixe em branco para manter a atual" type={showKey ? 'text' : 'password'} />
                  <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome da instância</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={evolutionInstancia} onChange={e => setEvolutionInstancia(e.target.value)} placeholder="clinicaai" />
                <p className="text-xs text-gray-400 mt-1">Nome da instância criada no painel da Evolution API.</p>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar configuração WhatsApp
              </button>
            </form>
          )}

          {tab === 'pagamentos' && (
            <form onSubmit={salvarPagamentos} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-sm text-emerald-800">
                <p className="font-medium mb-2">Conecte sua conta do Mercado Pago</p>
                <p className="text-emerald-700 mb-3">Os pagamentos dos seus pacientes vão direto para a sua conta — sem intermediários.</p>
                <a href="https://www.mercadopago.com.br/developers/pt/docs/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 font-medium hover:text-emerald-900 underline text-xs">
                  Como obter o Access Token <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Access Token do Mercado Pago
                  {mpTokenSalvo && <span className="ml-2 text-emerald-600 font-medium">✓ configurado</span>}
                </label>
                <div className="relative">
                  <input
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    value={mpToken}
                    onChange={e => { setMpToken(e.target.value); if (mpTokenSalvo) setMpTokenSalvo(false) }}
                    placeholder="APP_USR-... ou TEST-..."
                    type={showMpToken ? 'text' : 'password'}
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setShowMpToken(!showMpToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showMpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Começa com <code className="bg-gray-100 px-1 rounded">APP_USR-</code> (produção) ou <code className="bg-gray-100 px-1 rounded">TEST-</code> (testes).</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-medium mb-1">Passo a passo</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse <strong>mercadopago.com.br</strong> e faça login</li>
                  <li>Vá em <strong>Seu negócio → Configurações → Credenciais</strong></li>
                  <li>Copie o <strong>Access Token de produção</strong> (APP_USR-...)</li>
                  <li>Cole acima e clique em Salvar</li>
                </ol>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Salvar token do Mercado Pago
              </button>
            </form>
          )}

          {tab === 'conta' && (
            <form onSubmit={alterarSenha} className="space-y-4">
              <p className="text-sm text-gray-600">E-mail da conta: <span className="font-medium text-gray-900">{perfil?.email}</span></p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nova senha</label>
                <div className="relative">
                  <input className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} type={showSenha ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" required minLength={8} />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar nova senha</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} type={showSenha ? 'text' : 'password'} placeholder="Repita a nova senha" required />
              </div>
              <button type="submit" disabled={saving || !novaSenha || !confirmarSenha} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Alterar senha
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
