'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, ArrowRight } from 'lucide-react'

export default function BemVindoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const plano = searchParams.get('plano')

  const aprovado = status === 'ativo'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {aprovado ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo à Clínica.ai!</h1>
            <p className="text-gray-500 mb-2">
              Pagamento confirmado. Sua conta está ativa.
            </p>
            {plano === 'premium' && (
              <p className="text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-4 py-2 mb-6 inline-block">
                ✓ Módulo Financeiro ativado
              </p>
            )}
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors mt-4"
            >
              Acessar minha conta <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento em processamento</h1>
            <p className="text-gray-500 mb-6">
              Seu pagamento está sendo processado. Você receberá um e-mail quando confirmado.
              Se o pagamento não for aprovado em alguns minutos, tente novamente.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Ir para login <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
