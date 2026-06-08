'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { convitesApi, authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Loader2, CheckCircle, AlertCircle, Brain } from 'lucide-react'

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

  // Valida token ao montar
  useEffect(() => {
    if (!token) {
      setConviteErro('Link de convite inválido ou não encontrado.')
      setValidando(false)
      return
    }
    convitesApi.validar(token)
      .then(r => {
        if (r.valido) setConviteOk(true)
        else setConviteErro(r.motivo || 'Convite inválido.')
      })
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
      // Faz login para obter token e preencher contexto
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (e: unknown) {
      setErro((e as Error).message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  // Estados de carregamento/erro do convite
  if (validando) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
    </div>
  )

  if (!conviteOk) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">Convite inválido</h1>
        <p className="text-sm text-gray-500">{conviteErro}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clínica.ai</h1>
            <p className="text-xs text-indigo-600 font-medium">Acesso beta exclusivo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 mb-6 mt-4">
          <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-700">
            <span className="font-semibold">Convite válido!</span> Você terá 30 dias grátis com até 3 pacientes.
          </p>
        </div>

        <form onSubmit={submeter} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
            <input
              required
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Seu nome"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Especialidade</label>
            <input
              value={form.especialidade}
              onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}
              placeholder="Ex.: Psicologia Clínica"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
            <input
              required type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="voce@email.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Senha *</label>
            <input
              required type="password" minLength={6}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar senha *</label>
            <input
              required type="password"
              value={form.confirmar}
              onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
              placeholder="Repita a senha"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {erro && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : 'Entrar no beta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Já tem conta?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">Fazer login</a>
        </p>
      </div>
    </div>
  )
}

export default function RegistrarBetaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>}>
      <RegistrarBetaForm />
    </Suspense>
  )
}
