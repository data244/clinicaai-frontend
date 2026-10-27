'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { perfilApi, assinaturaApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { FalarComSuporte } from '@/components/Suporte'
import { CobrancaPelaData } from '@/components/EmpresaResponsavel'
import CartaoMercadoPago, { CampoCartao, CARTAO_NA_PAGINA, CartaoIncompleto, erroDoCartao } from '@/components/CartaoMercadoPago'

// Tela de assinatura (Rascunho v2, item 1.11): para quem já tem conta e quer voltar
// (cancelou ou está em modo leitura). Quem chega sem conta vai para o cadastro.
// ?agora=1 (botão "Começar a assinatura agora" do E8 e "Concluir pagamento"): primeira
// cobrança hoje, também para quem já deu o cartão no teste; a cobrança do fim do teste é
// cancelada quando o Mercado Pago aprovar a nova.
// Opção B (27/10): o cartão é digitado aqui, nos campos seguros do Mercado Pago. Se o
// formulário não carregar, o pagamento é feito no site do Mercado Pago, como antes.
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function AssinarPage() {
  const router = useRouter()
  const { token, isLoading, logout } = useAuth()
  const [pronto, setPronto] = useState(false)
  const [agora, setAgora] = useState(false)
  // Cobrança da assinatura recusada: a deste mês é feita hoje ("Concluir pagamento")
  const [refazer, setRefazer] = useState(false)
  // Cartão dado no teste: a cobrança marcada para o fim dele sai quando a nova for aprovada
  const [comCartao, setComCartao] = useState(false)
  // Ainda no teste: a cobrança fica para o dia em que ele termina
  const [noFimDoTeste, setNoFimDoTeste] = useState<string | null>(null)
  const [email, setEmail] = useState<string | undefined>()
  const [concordo, setConcordo] = useState(false)
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')
  const [suporte, setSuporte] = useState(false)
  // Sem o formulário do cartão (sem chave pública ou não carregou): pagamento no site do Mercado Pago
  const [noSiteDoMp, setNoSiteDoMp] = useState(!CARTAO_NA_PAGINA)
  const cartao = useRef<CampoCartao>(null)
  // O formulário não carregou: "Tentar de novo" e, abaixo, o site do Mercado Pago
  const falhou = noSiteDoMp && CARTAO_NA_PAGINA
  const tentarDeNovo = () => { setErro(''); setSuporte(false); setNoSiteDoMp(false) }

  useEffect(() => {
    if (isLoading) return
    const ja = new URLSearchParams(window.location.search).get('agora') === '1'
    setAgora(ja)
    if (!token) {
      router.replace(ja ? `/login?depois=${encodeURIComponent('/assinar?agora=1')}` : '/cadastro')
      return
    }
    const falha = () => { setErro('Não foi possível carregar sua conta. Verifique a internet e tente de novo em instantes.'); setPronto(true) }
    perfilApi.get()
      .then(async p => {
        const a = p.acesso
        if (a?.situacao === 'falta_cartao') { router.replace('/cartao'); return }
        setEmail(p.email)
        if (ja) {
          // Cobrança recusada: a conta pode seguir ativa, mas o pagamento do mês falta
          const recusado = !!(await assinaturaApi.status()).pagamento_recusado
          // Assinatura paga em dia: nada a começar
          if (!recusado && (a?.situacao === 'ativo' || a?.situacao === 'admin')) { router.replace('/configuracoes?aba=assinatura'); return }
          setRefazer(recusado)
          setComCartao(!recusado && !!a?.cartao)
          setPronto(true)
          return
        }
        // Assinatura paga em dia: nada a assinar (aqui a cobrança seria no mesmo dia, a segunda do mês).
        // Com a cobrança do mês recusada, a tela é a do "Concluir pagamento".
        if (a?.situacao === 'ativo' || a?.situacao === 'admin') {
          if (!(await assinaturaApi.status()).pagamento_recusado) { router.replace('/configuracoes?aba=assinatura'); return }
          setAgora(true)
          setRefazer(true)
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
      .catch(falha)
  }, [isLoading, token, router])

  const assinar = async () => {
    setIndo(true)
    setErro('')
    setSuporte(false)
    if (noSiteDoMp) {
      try {
        const checkout = await (agora ? assinaturaApi.comecarAgora() : assinaturaApi.checkoutTrial())
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
      const t = await cartao.current!.token()
      const r = await (agora ? assinaturaApi.comecarAgora(t) : assinaturaApi.checkoutTrial(t))
      const id = r.preapproval_id ? `preapproval_id=${encodeURIComponent(r.preapproval_id)}` : ''
      router.replace('/bem-vindo' + (agora ? `?agora=1${id && '&' + id}` : id && '?' + id))
    } catch (e: unknown) {
      setErro(erroDoCartao(e))
      setSuporte(!(e instanceof CartaoIncompleto))
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
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{refazer ? 'Concluir o pagamento' : 'Assinar o Clínica.ai'}</h2>
      {refazer ? (
        <p className="text-sm text-gray-600 leading-relaxed mb-2">
          O último pagamento não foi aprovado. Informe o cartão: a cobrança deste mês, de R$ 99, é feita hoje. Depois, todo mês no mesmo dia.
        </p>
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed mb-2">
          R$ 99 por mês, no cartão, pelo Mercado Pago. Primeira cobrança: {data ?? 'hoje'}. Depois, todo mês no mesmo dia.
        </p>
      )}
      {comCartao && (
        <p className="text-sm text-gray-600 leading-relaxed mb-2">
          A cobrança marcada para o fim do teste é cancelada: você paga uma vez por mês.
        </p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed mb-5">
        Para cancelar: em &quot;Minha assinatura&quot;, a qualquer momento.
      </p>
      <label className="flex items-start gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
        <input
          type="checkbox" className="mt-0.5 w-4 h-4 accent-primary-600 shrink-0"
          checked={concordo} onChange={e => setConcordo(e.target.checked)}
        />
        <span>Li e concordo com a cobrança mensal de R$ 99 a partir de {data ?? 'hoje'}.</span>
      </label>
      <CobrancaPelaData className="mb-5" />
      {!noSiteDoMp && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            Digite o cartão nos campos do Mercado Pago. O número do cartão e o CPF ficam com o Mercado Pago, não com o Clínica.ai.
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
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {erro}
        </div>
      )}
      {suporte && <div className="mb-4"><FalarComSuporte pagina="assinar" /></div>}
      {falhou ? (
        <button onClick={tentarDeNovo} disabled={indo} className="btn-primary w-full disabled:opacity-60">Tentar de novo</button>
      ) : (
        <button
          onClick={assinar} disabled={!concordo || indo}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {indo && <Loader2 className="w-4 h-4 animate-spin" />}
          {refazer ? 'Concluir pagamento' : 'Assinar por R$ 99 por mês'}
        </button>
      )}
      {falhou && (
        <div className="text-center mt-4">
          <button
            onClick={assinar} disabled={!concordo || indo}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 underline disabled:opacity-50 disabled:no-underline"
          >
            Informar o cartão no site do Mercado Pago
          </button>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">
            Lá, entre com a conta do Mercado Pago que usa o mesmo e-mail do seu cadastro no Clínica.ai.
          </p>
        </div>
      )}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700 transition-colors">Voltar ao painel</button>
        <button onClick={logout} className="text-gray-500 hover:text-gray-700 transition-colors">Sair</button>
      </div>
    </div>
  )
}
