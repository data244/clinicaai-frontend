'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Opção B (27/10): o cartão é digitado na nossa página, nos campos seguros do Mercado Pago
// (Card Payment Brick). O navegador troca o cartão por um token de uso único e só o token vai
// para o nosso servidor. Número do cartão e CPF ficam no Mercado Pago; nada disso é guardado aqui.
const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''
const SDK = 'https://sdk.mercadopago.com/js/v2'
const CAIXA = 'cartao-mercado-pago'

// Sem a chave pública no Vercel, as telas seguem com o pagamento no site do Mercado Pago
export const CARTAO_NA_PAGINA = !!CHAVE_PUBLICA

// Campo vazio ou inválido: o próprio formulário marca o que falta
export class CartaoIncompleto extends Error {}

export type CampoCartao = { token: () => Promise<string> }

// Texto do erro para a tela. Cartão recusado vem do servidor (402), com "Nada foi cobrado."
export function erroDoCartao(e: unknown): string {
  if (e instanceof CartaoIncompleto) return 'Confira os dados do cartão nos campos acima.'
  return e instanceof Error && e.message ? e.message : 'Não foi possível cadastrar o cartão agora. Tente de novo em instantes.'
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { MercadoPago?: any }
}

let carregando: Promise<void> | null = null
function carregarSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()
  if (!carregando) {
    carregando = new Promise((ok, falha) => {
      const s = document.createElement('script')
      s.src = SDK
      s.async = true
      s.onload = () => ok()
      s.onerror = () => { carregando = null; falha(new Error('SDK do Mercado Pago não carregou')) }
      document.head.appendChild(s)
    })
  }
  return carregando
}

type Props = {
  email?: string
  valor: number
  // O formulário não carregou: a tela oferece o pagamento no site do Mercado Pago
  onFalha: () => void
}

const CartaoMercadoPago = forwardRef<CampoCartao, Props>(function CartaoMercadoPago({ email, valor, onFalha }, ref) {
  const controle = useRef<any>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let ativo = true
    let carregou = false
    // Chave errada ou Mercado Pago fora do ar: o formulário falha sem avisar e a tela ficaria
    // carregando para sempre. Sem o formulário pronto em 20 s, a tela oferece o site do Mercado Pago.
    const falhar = () => { if (ativo) { ativo = false; clearTimeout(espera); onFalha() } }
    const espera = setTimeout(falhar, 20000)
    carregarSdk()
      .then(async () => {
        if (!ativo) return
        const mp = new window.MercadoPago(CHAVE_PUBLICA, { locale: 'pt-BR' })
        const c = await mp.bricks().create('cardPayment', CAIXA, {
          initialization: { amount: valor, ...(email ? { payer: { email } } : {}) },
          customization: {
            visual: { hideFormTitle: true, hidePaymentButton: true },
            paymentMethods: { maxInstallments: 1 },
          },
          callbacks: {
            onReady: () => { if (ativo) { carregou = true; clearTimeout(espera); setPronto(true) } },
            // O botão é o da nossa tela (token() abaixo); este não aparece
            onSubmit: () => Promise.resolve(),
            onError: (e: any) => { if (!carregou || e?.type === 'critical') falhar() },
          },
        })
        if (!ativo) { c.unmount?.(); return }
        controle.current = c
      })
      .catch(falhar)
    return () => {
      ativo = false
      clearTimeout(espera)
      controle.current?.unmount?.()
      controle.current = null
    }
    // Monta uma vez: o formulário guarda o que a pessoa digitou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    // Um token novo a cada envio: o Mercado Pago aceita cada um uma vez só
    token: async () => {
      if (!controle.current) throw new CartaoIncompleto()
      let dados: any
      try {
        dados = await controle.current.getFormData()
      } catch {
        throw new CartaoIncompleto()
      }
      if (!dados?.token) throw new CartaoIncompleto()
      return String(dados.token)
    },
  }), [])

  return (
    <div>
      {!pronto && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      )}
      <div id={CAIXA} />
    </div>
  )
})

export default CartaoMercadoPago
