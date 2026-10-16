'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, CreditCard, Loader2, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'

// Só o plano Base está à venda (VENDAS.md, 14/10/2026).
const PLANO = {
  nome: 'Clínica.ai Base',
  preco: 99,
  features: [
    'Agenda',
    'Prontuário clínico completo',
    'Mapa longitudinal com IA',
    'Copiloto clínico',
    'Financeiro básico (cobranças + links de pagamento)',
  ],
}

function AssinarContent() {
  const searchParams = useSearchParams()
  const erroInicial = searchParams.get('status') === 'erro'

  const [step, setStep] = useState<'plano' | 'cadastro'>(erroInicial ? 'cadastro' : 'plano')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(erroInicial ? 'Houve um problema com o pagamento. Tente novamente.' : '')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [especialidade, setEspecialidade] = useState('')

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
          plano: 'base',
          email,
          nome,
          password,
          especialidade: especialidade || undefined,
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

        {step === 'plano' && (
          <>
            <div className="max-w-md mx-auto rounded-2xl border-2 border-primary-600 bg-primary-50 shadow-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900">{PLANO.nome}</h3>
              <div className="mt-1 mb-4">
                <span className="text-3xl font-bold text-primary-700">R${PLANO.preco}</span>
                <span className="text-gray-500 text-sm">/mês</span>
              </div>
              <ul className="space-y-2">
                {PLANO.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('cadastro')}
                className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-lg"
              >
                Assinar por R${PLANO.preco}/mês
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
              <button onClick={() => setStep('plano')} className="text-sm text-primary-600 hover:underline">
                ← Voltar
              </button>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-6 text-sm">
              <span className="font-medium text-primary-800">Plano:</span>{' '}
              <span className="text-primary-700">{PLANO.nome}, R${PLANO.preco}/mês</span>
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
                A primeira cobrança, de R${PLANO.preco}, é feita hoje no Mercado Pago. Depois, uma cobrança por mês.
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
