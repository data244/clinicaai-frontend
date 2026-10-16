'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { assinaturaApi, Bloqueio, CheckoutAssinatura } from '@/lib/api'
import type { AcessoConta } from '@/types'
import { Eye, Lock, Zap, Loader2, CreditCard } from 'lucide-react'

function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

// Botão Assinar: prepara a assinatura no Mercado Pago e mostra plano, valor e
// data da primeira cobrança antes de abrir o pagamento.
export function useAssinar() {
  const [abrindo, setAbrindo] = useState(false)
  const [checkout, setCheckout] = useState<CheckoutAssinatura | null>(null)

  const abrir = async () => {
    setAbrindo(true)
    try {
      setCheckout(await assinaturaApi.checkoutTrial())
    } catch {
      alert('Não foi possível abrir o pagamento agora. Tente de novo em instantes.')
    }
    setAbrindo(false)
  }

  const janela = checkout && <JanelaAssinatura checkout={checkout} onFechar={() => setCheckout(null)} />
  return { abrir, abrindo, janela }
}

function JanelaAssinatura({ checkout, onFechar }: { checkout: CheckoutAssinatura; onFechar: () => void }) {
  const [indo, setIndo] = useState(false)
  const valor = (checkout.valor ?? 99).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const primeira = checkout.primeira_cobranca
  // Mais de 1 hora à frente: a cobrança fica para o fim do teste
  const depois = !!primeira && new Date(primeira).getTime() - Date.now() > 60 * 60 * 1000

  return createPortal(
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl mb-4">
          <CreditCard className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Assinar o plano Base</h2>
        <p className="text-2xl font-bold text-indigo-700 mb-4">{valor}<span className="text-sm font-normal text-gray-500">/mês</span></p>
        <p className="text-sm text-gray-600 mb-1 leading-relaxed">
          {!primeira
            ? 'O pagamento é feito no Mercado Pago.'
            : depois
              ? `A primeira cobrança será em ${dataBr(primeira)}, quando o seu teste termina.`
              : 'A primeira cobrança é feita hoje, no Mercado Pago.'}
        </p>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">Depois, uma cobrança por mês.</p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => { setIndo(true); window.location.href = checkout.init_point }}
            disabled={indo}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {indo && <Loader2 className="w-4 h-4 animate-spin" />}
            Ir para o pagamento
          </button>
          <button onClick={onFechar} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Agora não
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function BotaoAssinar({ texto = 'Assinar' }: { texto?: string }) {
  const { abrir, abrindo, janela } = useAssinar()
  return (
    <>
      <button
        onClick={abrir}
        disabled={abrindo}
        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {abrindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {texto}
      </button>
      {janela}
    </>
  )
}

// Aviso no topo da página quando a conta não tem acesso completo
// (ou tem acesso completo só até uma data).
export function AvisoModoLeitura({ acesso }: { acesso: AcessoConta }) {
  if (acesso.completo && acesso.situacao === 'acesso_ate' && acesso.acesso_ate) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-900 flex items-center gap-2">
        <Eye className="w-4 h-4 shrink-0" />
        <span>Seu acesso completo vai até {dataBr(acesso.acesso_ate)}. Depois disso a conta fica em modo leitura.</span>
      </div>
    )
  }
  if (acesso.completo) return null

  let texto = 'Sua conta está em modo leitura: você vê o que já registrou, mas não cria nem altera nada. Assine para voltar ao acesso completo.'
  let botao = 'Assinar'
  if (acesso.situacao === 'teste_vencido') {
    texto = 'Seu teste terminou. Você continua vendo tudo o que registrou, mas não cria nem altera nada até assinar.'
  } else if (acesso.situacao === 'pagamento_pendente') {
    texto = 'Seu pagamento ainda não foi confirmado. Até lá a conta fica em modo leitura: você vê o que registrou, mas não cria nem altera nada.'
    botao = 'Concluir pagamento'
  }
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-2 text-sm text-amber-900 flex-1">
        <Eye className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{texto}</span>
      </div>
      <BotaoAssinar texto={botao} />
    </div>
  )
}

// Janela que aparece quando o servidor recusa uma gravação (modo leitura ou limite do teste)
export function ModalBloqueio({ bloqueio, onFechar }: { bloqueio: Bloqueio; onFechar: () => void }) {
  const titulo = bloqueio.codigo === 'LIMITE_TESTE' ? 'Limite do teste atingido' : 'Conta em modo leitura'
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl mb-4">
          <Lock className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{bloqueio.mensagem}</p>
        <div className="flex flex-col items-center gap-3">
          <BotaoAssinar />
          <button onClick={onFechar} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
