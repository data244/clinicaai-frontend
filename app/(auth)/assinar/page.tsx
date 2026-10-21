'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { perfilApi, assinaturaApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'

// Tela de assinatura (Rascunho v2, item 1.11): para quem já tem conta e quer voltar
// (cancelou ou está em modo leitura). Quem chega sem conta vai para o cadastro.
// ?agora=1 (botão "Começar a assinatura agora" do E8): primeira cobrança hoje, também
// para quem já deu o cartão no teste; a cobrança do fim do teste é cancelada quando
// o Mercado Pago aprovar a nova.
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function AssinarPage() {
  const router = useRouter()
  const { token, isLoading, logout } = useAuth()
  const [pronto, setPronto] = useState(false)
  const [agora, setAgora] = useState(false)
  // Cartão dado no teste: a cobrança marcada para o fim dele sai quando a nova for aprovada
  const [comCartao, setComCartao] = useState(false)
  // Ainda no teste: a cobrança fica para o dia em que ele termina
  const [noFimDoTeste, setNoFimDoTeste] = useState<string | null>(null)
  const [concordo, setConcordo] = useState(false)
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (isLoading) return
    const ja = new URLSearchParams(window.location.search).get('agora') === '1'
    setAgora(ja)
    if (!token) {
      router.replace(ja ? `/login?depois=${encodeURIComponent('/assinar?agora=1')}` : '/cadastro')
      return
    }
    perfilApi.get()
      .then(p => {
        const a = p.acesso
        if (a?.situacao === 'falta_cartao') { router.replace('/cartao'); return }
        if (ja) {
          // Assinatura paga em dia: nada a começar
          if (a?.situacao === 'ativo' || a?.situacao === 'admin') { router.replace('/configuracoes?aba=assinatura'); return }
          setComCartao(!!a?.cartao)
          setPronto(true)
          return
        }
        // Cartão já cadastrado no teste: nada a assinar, a cobrança já está marcada
        if (a?.cartao) { router.replace('/configuracoes?aba=assinatura'); return }
        if (a?.situacao === 'teste' && !a.cartao && a.fim_teste
            && new Date(a.fim_teste).getTime() - Date.now() > 60 * 60 * 1000) {
          setNoFimDoTeste(a.fim_teste)
        }
        setPronto(true)
      })
      .catch(() => { setErro('Não foi possível carregar sua conta. Verifique a internet e tente de novo em instantes.'); setPronto(true) })
  }, [isLoading, token, router])

  const assinar = async () => {
    setIndo(true)
    setErro('')
    try {
      const checkout = await (agora ? assinaturaApi.comecarAgora() : assinaturaApi.checkoutTrial())
      window.location.href = checkout.init_point
    } catch (e: unknown) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível abrir o Mercado Pago agora. Tente de novo em instantes.')
      setIndo(false)
    }
  }

  if (!pronto) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const data = noFimDoTeste ? dataBr(noFimDoTeste) : null
  return (
    <div className="card">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
        <CreditCard className="w-6 h-6 text-primary-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Assinar o Clínica.ai</h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-2">
        R$ 99 por mês, no cartão, pelo Mercado Pago. Primeira cobrança: {data ?? 'hoje'}. Depois, todo mês no mesmo dia.
      </p>
      {comCartao && (
        <p className="text-sm text-gray-600 leading-relaxed mb-2">
          A cobrança marcada para o fim do teste é cancelada: você paga uma vez por mês.
        </p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed mb-5">
        Para cancelar: em &quot;Minha assinatura&quot;, a qualquer momento.
      </p>
      <label className="flex items-start gap-2 text-sm text-gray-700 mb-5 cursor-pointer">
        <input
          type="checkbox" className="mt-0.5 w-4 h-4 accent-primary-600 shrink-0"
          checked={concordo} onChange={e => setConcordo(e.target.checked)}
        />
        <span>Li e concordo com a cobrança mensal de R$ 99 a partir de {data ?? 'hoje'}.</span>
      </label>
      {erro && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {erro}
        </div>
      )}
      <button
        onClick={assinar} disabled={!concordo || indo}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {indo && <Loader2 className="w-4 h-4 animate-spin" />}
        Assinar por R$ 99 por mês
      </button>
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700 transition-colors">Voltar ao painel</button>
        <button onClick={logout} className="text-gray-500 hover:text-gray-700 transition-colors">Sair</button>
      </div>
    </div>
  )
}
