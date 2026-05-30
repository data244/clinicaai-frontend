'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, CreditCard, Loader2, Star, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'

const PLANOS = {
  base: {
    nome: 'Clínica.ai Base',
    preco: 99,
    destaque: false,
    features: [
      'Agenda com lembretes WhatsApp',
      'Prontuário clínico completo',
      'Mapa longitudinal com IA',
      'Copiloto clínico',
      'Financeiro básico (cobranças + links de pagamento)',
    ],
  },
  premium: {
    nome: 'Base + Módulo Financeiro',
    preco: 129,
    destaque: true,
    features: [
      'Tudo do plano Base',
      'Lembretes automáticos de cobrança',
      'Régua de inadimplência automática',
      'Dashboard de receita e fluxo de caixa',
      'Relatórios financeiros',
    ],
  },
}

function AssinarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const erroInicial = searchParams.get('status') === 'erro'

  const [planoSelecionado, setPlanoSelecionado] = useState<'base' | 'premium'>('base')
  const [step, setStep] = useState<'planos' | 'cadastro'>(erroInicial ? 'cadastro' : 'planos')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(erroInicial ? 'Houve um problema com o pagamento. Tente novamente.' : '')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [telefone, setTelefone] = useState('')

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setErro('Senha deve ter pelo menos 8 caracteres.')
      return
    }
    setLoading(true)
    setErro('')

    try {
      const res = await fetch(`${API_URL}/api/v1/assinatura/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano: planoSelecionado,
          email,
          nome,
          password,
          especialidade: especialidade || undefined,
          telefone: telefone || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) throw new Error('E-mail já cadastrado. Faça login.')
        throw new Error(data.detail || 'Erro ao criar conta.')
      }

      if (data.init_point) {
        // Redirecionar para Mercado Pago
        window.location.href = data.init_point
      } else {
        throw new Error('Link de pagamento não gerado. Tente novamente.')
      }
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">

        {/* Logo e header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clínica.ai</h1>
          <p className="text-gray-500">Inteligência clínica para profissionais de saúde</p>
        </div>

        {step === 'planos' && (
          <>
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">Escolha seu plano</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {(Object.entries(PLANOS) as [string, typeof PLANOS.base][]).map(([key, plano]) => (
                <button
                  key={key}
                  onClick={() => setPlanoSelecionado(key as 'base' | 'premium')}
                  className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                    planoSelecionado === key
                      ? 'border-primary-600 bg-primary-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Mais popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plano.nome}</h3>
                      <div className="mt-1">
                        <span className="text-3xl font-bold text-primary-700">R${plano.preco}</span>
                        <span className="text-gray-500 text-sm">/mês</span>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                      planoSelecionado === key ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                    }`}>
                      {planoSelecionado === key && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plano.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('cadastro')}
                className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg"
              >
                Começar com {PLANOS[planoSelecionado].nome} — R${PLANOS[planoSelecionado].preco}/mês
              </button>
              <p className="text-xs text-gray-400 mt-3">Cancele quando quiser. Sem fidelidade.</p>
            </div>

            <p className="text-center mt-6 text-sm text-gray-500">
              Já tem conta?{' '}
              <a href="/login" className="text-primary-600 hover:underline font-medium">Fazer login</a>
            </p>
          </>
        )}

        {step === 'cadastro' && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep('planos')} className="text-sm text-primary-600 hover:underline">
                ← Voltar
              </button>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-6 text-sm">
              <span className="font-medium text-primary-800">Plano selecionado:</span>{' '}
              <span className="text-primary-700">{PLANOS[planoSelecionado].nome} — R${PLANOS[planoSelecionado].preco}/mês</span>
            </div>

            {erro && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {erro}
              </div>
            )}

            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Dr. João Silva" required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={email} onChange={e => setEmail(e.target.value)}
                  type="email" placeholder="seu@email.com" required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={password} onChange={e => setPassword(e.target.value)}
                  type="password" placeholder="Mínimo 8 caracteres" required minLength={8}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Especialidade</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={especialidade} onChange={e => setEspecialidade(e.target.value)}
                  placeholder="Ex: Psicologia, Nutrição, Fisioterapia..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={telefone} onChange={e => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <button
                type="submit" disabled={loading || !nome || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Criar conta e ir para pagamento</>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                Você será redirecionado para o Mercado Pago para realizar o primeiro pagamento com segurança.
              </p>
            </form>

            <p className="text-center mt-4 text-sm text-gray-500">
              Já tem conta?{' '}
              <a href="/login" className="text-primary-600 hover:underline font-medium">Fazer login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <AssinarContent />
    </Suspense>
  )
}
