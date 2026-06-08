'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { convitesApi, authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Loader2, CheckCircle, AlertCircle, Brain, TrendingUp, MessageSquare, Calendar, Lock } from 'lucide-react'

const BENEFICIOS = [
  {
    Icon: TrendingUp,
    titulo: 'Inteligência longitudinal',
    desc: 'A IA acompanha a evolução do paciente ao longo do tempo e identifica padrões que passam despercebidos sessão a sessão.',
  },
  {
    Icon: MessageSquare,
    titulo: 'Copiloto clínico',
    desc: 'Um assistente que conhece o histórico completo de cada paciente e apoia suas hipóteses diagnósticas.',
  },
  {
    Icon: Calendar,
    titulo: 'Gestão integrada',
    desc: 'Agenda, prontuário, cobranças e lembretes automáticos — tudo no mesmo lugar, pensado para psicólogos.',
  },
]

function RegistrarBetaForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuth()
  const token = searchParams.get('convite') || ''

  const [validando, setValidando] = useState(true)
  const [conviteOk, setConviteOk] = useState(false)
  const [conviteErro, setConviteErro] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', password: '', confirmar: '', especialidade: '', telefone: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setConviteErro('Link de convite inválido.'); setValidando(false); return }
    convitesApi.validar(token)
      .then(r => { if (r.valido) setConviteOk(true); else setConviteErro(r.motivo || 'Convite inválido.') })
      .catch(() => setConviteErro('Não foi possível validar o convite.'))
      .finally(() => setValidando(false))
  }, [token])

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (form.password !== form.confirmar) { setErro('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await convitesApi.registrarBeta({
        token_convite: token,
        email: form.email,
        password: form.password,
        nome: form.nome,
        especialidade: form.especialidade || undefined,
        telefone: form.telefone || undefined,
      })
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (e: unknown) {
      setErro((e as Error).message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  if (validando) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
    </div>
  )

  if (!conviteOk) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0d1117]">
      <div className="bg-[#161b22] border border-white/10 rounded-2xl max-w-sm w-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-white mb-2">Convite inválido</h1>
        <p className="text-sm text-gray-400">{conviteErro}</p>
        <p className="text-xs text-gray-600 mt-4">Verifique se o link está completo ou peça um novo convite ao responsável.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Clínica.ai</span>
        </div>

        {/* Badge exclusividade */}
        <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Lock className="w-3.5 h-3.5" />
          Acesso Beta — apenas por convite
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Você foi convidado<br />
          <span className="text-indigo-400">para ver o futuro</span><br />
          da sua prática clínica.
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          O Clínica.ai é a única plataforma que acompanha seus pacientes ao longo do tempo
          e revela padrões invisíveis sessão a sessão — antes que eles se tornem crises.
        </p>
      </div>

      {/* Benefícios */}
      <div className="max-w-4xl mx-auto px-6 pb-14 grid md:grid-cols-3 gap-5">
        {BENEFICIOS.map(({ Icon, titulo, desc }) => (
          <div key={titulo} className="bg-[#161b22] border border-white/8 rounded-2xl p-5">
            <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-3">
              <Icon className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">{titulo}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <div className="max-w-md mx-auto px-6 pb-20">
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">Convite válido.</span>{' '}
              30 dias grátis · até 3 pacientes · sem cartão de crédito.
            </p>
          </div>

          <form onSubmit={submeter} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nome completo *</label>
              <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Seu nome"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Especialidade</label>
              <input value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}
                placeholder="Ex.: Psicologia Clínica"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">E-mail *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="voce@email.com"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Senha *</label>
              <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Confirmar senha *</label>
              <input required type="password" value={form.confirmar} onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                placeholder="Repita a senha"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {erro && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{erro}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando sua conta...</> : 'Entrar no beta →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            Já tem conta?{' '}
            <a href="/login" className="text-indigo-400 hover:text-indigo-300">Fazer login</a>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Clínica.ai · Inteligência clínica longitudinal
        </p>
      </div>
    </div>
  )
}

export default function RegistrarBetaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0d1117]"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>}>
      <RegistrarBetaForm />
    </Suspense>
  )
}
