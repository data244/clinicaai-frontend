'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { assinaturaApi, StatusAssinatura } from '@/lib/api'
import type { AcessoConta } from '@/types'
import { BotaoAssinar } from '@/components/AvisoConta'
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'

function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function reais(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Aba Minha assinatura: plano, valor, situação, próxima cobrança e o botão que cabe em cada caso
export default function MinhaAssinatura({ acesso }: { acesso?: AcessoConta }) {
  const [status, setStatus] = useState<StatusAssinatura | null>(null)
  const [erro, setErro] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelada, setCancelada] = useState<string | null>(null)

  const carregar = () => {
    setErro(false)
    assinaturaApi.status().then(setStatus).catch(() => setErro(true))
  }
  useEffect(carregar, [])

  if (erro) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border text-sm bg-red-50 border-red-200 text-red-800">
        <AlertCircle className="w-4 h-4 shrink-0" />
        Não foi possível carregar sua assinatura agora. Tente de novo em instantes.
      </div>
    )
  }
  if (!status) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
      </div>
    )
  }

  const situacao = acesso?.situacao
  const nomePlano = status.detalhes_plano?.nome || 'Clínica.ai Base'
  const valor = status.valor ?? status.detalhes_plano?.valor ?? 99
  const proxima = status.proxima_cobranca
  const proximaFutura = !!proxima && new Date(proxima).getTime() > Date.now()

  // Texto da situação e botão de cada caso
  let texto = ''
  let botao: 'assinar' | 'concluir' | 'cancelar' | null = null
  if (cancelada) {
    texto = cancelada
  } else if (status.pode_cancelar) {
    texto = proximaFutura
      ? `Assinatura ativa. Próxima cobrança: ${dataBr(proxima!)}, no Mercado Pago.`
      : 'Assinatura ativa, com cobrança mensal no Mercado Pago.'
    botao = 'cancelar'
  } else if (situacao === 'admin') {
    texto = 'Conta de administração, sem cobrança.'
  } else if (situacao === 'acesso_ate' && acesso?.acesso_ate) {
    texto = `Assinatura cancelada. Você tem acesso completo até ${dataBr(acesso.acesso_ate)}, sem nova cobrança. Depois disso a conta fica em modo leitura: você vê tudo o que registrou, mas não cria nem altera nada.`
  } else if (situacao === 'ativo') {
    texto = 'Sua conta está liberada, sem cobrança no momento.'
  } else if (situacao === 'teste') {
    texto = acesso?.fim_teste
      ? `Você está no teste grátis até ${dataBr(acesso.fim_teste)}.`
      : 'Você está no teste grátis.'
    if (acesso?.registros_limite) {
      texto += ` Registros usados: ${acesso.registros_usados ?? 0} de ${acesso.registros_limite}.`
    }
    botao = 'assinar'
  } else if (situacao === 'teste_vencido') {
    texto = 'Seu teste terminou. Você continua vendo tudo o que registrou, mas não cria nem altera nada até assinar.'
    botao = 'assinar'
  } else if (situacao === 'pagamento_pendente') {
    texto = 'Seu pagamento ainda não foi confirmado. Até lá a conta fica em modo leitura.'
    botao = 'concluir'
  } else {
    texto = 'Sua conta está em modo leitura: você vê o que já registrou, mas não cria nem altera nada. Assine para voltar ao acesso completo.'
    botao = 'assinar'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-0.5">Plano</p>
          <p className="text-base font-semibold text-gray-900">{nomePlano}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Valor</p>
          <p className="text-base font-semibold text-gray-900">{reais(valor)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
        </div>
      </div>

      <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
        cancelada || botao === 'cancelar' || situacao === 'admin' || situacao === 'ativo'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{texto}</span>
      </div>

      {botao === 'assinar' && <BotaoAssinar />}
      {botao === 'concluir' && <BotaoAssinar texto="Concluir pagamento" />}
      {botao === 'cancelar' && (
        <button
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Cancelar assinatura
        </button>
      )}

      <p className="text-xs text-gray-400">
        Dúvidas sobre cobrança: <a href="mailto:contato@clinicaai.net.br" className="underline hover:text-gray-600">contato@clinicaai.net.br</a>
      </p>

      {confirmando && (
        <JanelaCancelar
          ate={proximaFutura ? proxima! : null}
          onFechar={() => setConfirmando(false)}
          onCancelada={(mensagem) => { setConfirmando(false); setCancelada(mensagem); carregar() }}
        />
      )}
    </div>
  )
}

function JanelaCancelar({ ate, onFechar, onCancelada }: {
  ate: string | null
  onFechar: () => void
  onCancelada: (mensagem: string) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const cancelar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      const r = await assinaturaApi.cancelar()
      onCancelada(r.mensagem)
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível cancelar agora. Tente de novo em alguns minutos.')
      setEnviando(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-2xl mb-4">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Cancelar a assinatura?</h2>
        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
          {ate
            ? `Não haverá nova cobrança. Você continua com acesso completo até ${dataBr(ate)}.`
            : 'Não haverá nova cobrança.'}
        </p>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Depois disso a conta fica em modo leitura: você vê tudo o que registrou, mas não cria nem altera nada.
        </p>
        {erro && <p className="text-sm text-red-700 mb-4">{erro}</p>}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={cancelar}
            disabled={enviando}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
            Sim, cancelar
          </button>
          <button onClick={onFechar} disabled={enviando} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Manter assinatura
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
