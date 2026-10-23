'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { perfilApi, assinaturaApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { FalarComSuporte } from '@/components/Suporte'

// Cadastro, tela 2 (Rascunho v2, item 1.10): o cartão no Mercado Pago antes do teste.
// Quem volta depois sem ter informado o cartão vê antes o "Falta o cartão".
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function CartaoContent() {
  const router = useRouter()
  const { token, isLoading, logout } = useAuth()
  const veioDoCadastro = useSearchParams().get('passo') === 'cartao'
  const [passo, setPasso] = useState<'carregando' | 'falta' | 'cartao'>('carregando')
  const [dataCobranca, setDataCobranca] = useState<string | null>(null)
  const [concordo, setConcordo] = useState(false)
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!token) { router.replace('/login'); return }
    perfilApi.get()
      .then(p => {
        // Só a conta que ainda espera o cartão fica aqui; as outras vão para o painel
        if (p.acesso?.situacao !== 'falta_cartao') { router.replace('/dashboard'); return }
        setDataCobranca(p.acesso.primeira_cobranca ?? null)
        setPasso(veioDoCadastro ? 'cartao' : 'falta')
      })
      .catch(() => setErro('Não foi possível carregar sua conta. Verifique a internet e tente de novo em instantes.'))
  }, [isLoading, token, router, veioDoCadastro])

  const informarCartao = async () => {
    setIndo(true)
    setErro('')
    try {
      const checkout = await assinaturaApi.checkoutTrial()
      window.location.href = checkout.init_point
    } catch (e: unknown) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível abrir o Mercado Pago agora. Tente de novo em instantes.')
      setIndo(false)
    }
  }

  const sair = (
    <div className="text-center mt-6">
      <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Sair</button>
    </div>
  )

  if (erro && passo === 'carregando') {
    return (
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{erro}</p>
        {sair}
      </div>
    )
  }

  if (passo === 'carregando') {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (passo === 'falta') {
    return (
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
          <CreditCard className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Falta o cartão.</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Sua conta está criada, mas o teste só começa depois do cartão. Nada é cobrado no teste.
        </p>
        <button onClick={() => setPasso('cartao')} className="btn-primary w-full">Informar o cartão</button>
        {sair}
      </div>
    )
  }

  const data = dataCobranca ? dataBr(dataCobranca) : ''
  return (
    <div className="card">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
        <CreditCard className="w-6 h-6 text-primary-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Último passo: o cartão.</h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-5">
        Seu teste de 14 dias começa agora. Nada é cobrado hoje. A primeira cobrança, de R$ 99, é em {data}.
        Você recebe um aviso 3 dias antes. Cancele antes, em &quot;Minha assinatura&quot;, e não paga nada.
      </p>
      <label className="flex items-start gap-2 text-sm text-gray-700 mb-5 cursor-pointer">
        <input
          type="checkbox" className="mt-0.5 w-4 h-4 accent-primary-600 shrink-0"
          checked={concordo} onChange={e => setConcordo(e.target.checked)}
        />
        <span>Li e concordo com a cobrança mensal de R$ 99 a partir de {data}.</span>
      </label>
      {erro && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4">{erro}</div>
      )}
      {erro && <div className="mb-4"><FalarComSuporte pagina="cartao" /></div>}
      <button
        onClick={informarCartao} disabled={!concordo || indo}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {indo && <Loader2 className="w-4 h-4 animate-spin" />}
        Informar o cartão no Mercado Pago
      </button>
      {sair}
    </div>
  )
}

export default function CartaoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
      <CartaoContent />
    </Suspense>
  )
}
