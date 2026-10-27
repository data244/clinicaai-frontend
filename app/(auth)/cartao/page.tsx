'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { perfilApi, assinaturaApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { FalarComSuporte } from '@/components/Suporte'
import { CobrancaPelaData } from '@/components/EmpresaResponsavel'
import CartaoMercadoPago, { CampoCartao, CARTAO_NA_PAGINA, CartaoIncompleto, erroDoCartao } from '@/components/CartaoMercadoPago'

// Cadastro, tela 2 (Rascunho v2, item 1.10): o cartão antes do teste, digitado aqui nos campos
// seguros do Mercado Pago (opção B, 27/10). Se o formulário não carregar, o cartão vai no site do
// Mercado Pago, como antes. Quem volta depois sem ter informado o cartão vê antes o "Falta o cartão".
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
  const [suporte, setSuporte] = useState(false)
  const [email, setEmail] = useState<string | undefined>()
  // Sem o formulário do cartão (sem chave pública ou não carregou): pagamento no site do Mercado Pago
  const [noSiteDoMp, setNoSiteDoMp] = useState(!CARTAO_NA_PAGINA)
  const cartao = useRef<CampoCartao>(null)

  useEffect(() => {
    if (isLoading) return
    if (!token) { router.replace('/login'); return }
    perfilApi.get()
      .then(p => {
        // Só a conta que ainda espera o cartão fica aqui; as outras vão para o painel
        if (p.acesso?.situacao !== 'falta_cartao') { router.replace('/dashboard'); return }
        setEmail(p.email)
        setDataCobranca(p.acesso.primeira_cobranca ?? null)
        setPasso(veioDoCadastro ? 'cartao' : 'falta')
      })
      .catch(() => setErro('Não foi possível carregar sua conta. Verifique a internet e tente de novo em instantes.'))
  }, [isLoading, token, router, veioDoCadastro])

  const informarCartao = async () => {
    setIndo(true)
    setErro('')
    setSuporte(false)
    if (noSiteDoMp) {
      try {
        const checkout = await assinaturaApi.checkoutTrial()
        if (checkout.init_point) { window.location.href = checkout.init_point; return }
      } catch (e: unknown) {
        if (e instanceof Error && e.message) { setErro(e.message); setSuporte(true); setIndo(false); return }
      }
      setErro('Não foi possível abrir o Mercado Pago agora. Tente de novo em instantes.')
      setSuporte(true)
      setIndo(false)
      return
    }
    try {
      const r = await assinaturaApi.checkoutTrial(await cartao.current!.token())
      router.replace(r.preapproval_id ? `/bem-vindo?preapproval_id=${encodeURIComponent(r.preapproval_id)}` : '/bem-vindo')
    } catch (e: unknown) {
      setErro(erroDoCartao(e))
      setSuporte(!(e instanceof CartaoIncompleto))
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
      <label className="flex items-start gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
        <input
          type="checkbox" className="mt-0.5 w-4 h-4 accent-primary-600 shrink-0"
          checked={concordo} onChange={e => setConcordo(e.target.checked)}
        />
        <span>Li e concordo com a cobrança mensal de R$ 99 a partir de {data}.</span>
      </label>
      <CobrancaPelaData className="mb-5" />
      {!noSiteDoMp && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            Digite o cartão nos campos seguros do Mercado Pago. O número do cartão fica com o Mercado Pago, não com o Clínica.ai.
          </p>
          <CartaoMercadoPago ref={cartao} email={email} valor={99} onFalha={() => setNoSiteDoMp(true)} />
        </div>
      )}
      {noSiteDoMp && CARTAO_NA_PAGINA && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          O formulário do cartão não carregou. Você pode informar o cartão no site do Mercado Pago.
        </p>
      )}
      {erro && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4">{erro}</div>
      )}
      {suporte && <div className="mb-4"><FalarComSuporte pagina="cartao" /></div>}
      <button
        onClick={informarCartao} disabled={!concordo || indo}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {indo && <Loader2 className="w-4 h-4 animate-spin" />}
        {noSiteDoMp ? 'Informar o cartão no Mercado Pago' : 'Começar os 14 dias grátis'}
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
