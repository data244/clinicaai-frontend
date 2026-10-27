'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { assinaturaApi, pacientesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

// Depois do cartão: digitado na nossa página (opção B, 27/10) ou na volta do Mercado Pago.
// O endereço é o mesmo com ou sem pagamento, então a situação vem do servidor, não da URL.
// agora=1: assinatura com a primeira cobrança hoje. Só confirma quando ela virar a da
// conta; até lá, "Pagamento em processamento" (o cartão antigo do teste ainda aparece).
// Conta nova com o cartão aprovado: cadastro, tela 3 (Rascunho v2, item 1.10).
type Situacao = 'carregando' | 'teste' | 'confirmada' | 'aguardando' | 'sem_login'

const TENTATIVAS = 12 // uma por 5 segundos: 1 minuto esperando o aviso do Mercado Pago

function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

// Dia no calendário de Brasília (AAAA-MM-DD), para comparar datas sem a hora
function diaBr(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

// Último dia do teste: a véspera da primeira cobrança, como nos e-mails
function vesperaBr(iso: string) {
  return new Date(new Date(iso).getTime() - 86_400_000).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function BemVindoContent() {
  const router = useRouter()
  const { nome } = useAuth()
  const [situacao, setSituacao] = useState<Situacao>('carregando')
  const [proxima, setProxima] = useState<string | null>(null)
  const [plano, setPlano] = useState<string | null>(null)
  const [esperando, setEsperando] = useState(true)
  // Conta que ainda espera o cartão (cadastro novo) ou que voltou a assinar
  const [semCartao, setSemCartao] = useState(false)
  const [raquelId, setRaquelId] = useState<string | null>(null)
  const [agora, setAgora] = useState(false)

  useEffect(() => {
    let logado = false
    try { logado = !!localStorage.getItem('clinicaai_token') } catch {}
    if (!logado) { setSituacao('sem_login'); return }

    const params = new URLSearchParams(window.location.search)
    const agora = params.get('agora') === '1'
    const preapprovalId = params.get('preapproval_id')
    setAgora(agora)

    let parar = false
    let tentativa = 0
    const consultar = async () => {
      try {
        const s = await assinaturaApi.status(preapprovalId)
        if (parar) return
        if (agora) {
          if (s.status_conta === 'ativo' && !s.pagamento_recusado) {
            setProxima(s.proxima_cobranca ?? null)
            setPlano(s.plano)
            setSituacao('confirmada')
            return
          }
        } else if (s.teste_com_cartao) {
          setProxima(s.proxima_cobranca ?? null)
          setSituacao('teste')
          // A paciente fictícia que toda conta nova recebe
          pacientesApi.list()
            .then(lista => { if (!parar) setRaquelId(lista.find(p => p.ficticia)?.id ?? null) })
            .catch(() => {})
          return
        }
        if (!agora && (s.status_conta === 'ativo' || s.proxima_cobranca)) {
          setProxima(s.proxima_cobranca ?? null)
          setPlano(s.plano)
          setSituacao('confirmada')
          return
        }
        setSemCartao(!agora && s.status_conta === 'pendente_pagamento')
      } catch {
        if (parar) return
      }
      setSituacao('aguardando')
      tentativa += 1
      if (tentativa < TENTATIVAS) setTimeout(consultar, 5000)
      else setEsperando(false)
    }
    consultar()
    return () => { parar = true }
  }, [])

  const botao = (texto: string, destino: string) => (
    <button
      onClick={() => router.push(destino)}
      className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors mt-4"
    >
      {texto} <ArrowRight className="w-4 h-4" />
    </button>
  )

  const botaoSecundario = (texto: string, destino: string) => (
    <button
      onClick={() => router.push(destino)}
      className="block mx-auto px-6 py-3 text-primary-700 font-medium rounded-xl hover:bg-primary-50 transition-colors mt-2"
    >
      {texto}
    </button>
  )

  const primeiroNome = (nome || '').trim().split(/\s+/)[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {situacao === 'carregando' && (
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        )}

        {situacao === 'teste' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {primeiroNome ? `Tudo pronto, ${primeiroNome}.` : 'Tudo pronto.'}
            </h1>
            <p className="text-gray-500 mb-2">
              {proxima && <>Seu teste vai até {vesperaBr(proxima)}. </>}
              {raquelId && 'A Raquel, uma paciente fictícia, já está na sua lista com o caso pronto. Comece por ela para ver o Clínica.ai trabalhando.'}
            </p>
            {raquelId
              ? <>
                  {botao('Abrir o caso da Raquel', `/pacientes/${raquelId}`)}
                  {botaoSecundario('Cadastrar meu primeiro paciente', '/pacientes/novo')}
                </>
              : <>
                  {botao('Cadastrar meu primeiro paciente', '/pacientes/novo')}
                  {botaoSecundario('Ir para o painel', '/dashboard')}
                </>}
          </>
        )}

        {situacao === 'confirmada' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Assinatura confirmada</h1>
            {plano === 'base' && <p className="text-gray-500 mb-2">Plano Base, R$99/mês.</p>}
            {/* Primeira cobrança de hoje ainda em processamento: a próxima vem com o pagamento */}
            {proxima && diaBr(proxima) > diaBr(new Date().toISOString()) && (
              <p className="text-gray-500 mb-2">Próxima cobrança: {dataBr(proxima)}.</p>
            )}
            {botao('Ir para o painel', '/dashboard')}
          </>
        )}

        {situacao === 'aguardando' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {semCartao ? 'Cartão em processamento' : 'Pagamento em processamento'}
            </h1>
            {esperando ? (
              <p className="text-gray-500 mb-2 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Esperando a confirmação do Mercado Pago.
              </p>
            ) : semCartao ? (
              <p className="text-gray-500 mb-2">
                Ainda não recebemos a confirmação do Mercado Pago. Se você informou o cartão, ela chega em alguns minutos.
                Se não informou, use o botão abaixo para tentar de novo.
              </p>
            ) : (
              <p className="text-gray-500 mb-2">
                Ainda não recebemos a confirmação do Mercado Pago. Se você concluiu o pagamento, ela chega em alguns minutos.
                Se não concluiu, use o botão abaixo para tentar de novo.
              </p>
            )}
            {!esperando && (semCartao ? botao('Informar o cartão', '/cartao') : botao('Assinar', agora ? '/assinar?agora=1' : '/assinar'))}
            {botaoSecundario('Ir para o painel', '/dashboard')}
          </>
        )}

        {situacao === 'sem_login' && (
          <>
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo à Clínica.ai</h1>
            <p className="text-gray-500 mb-2">Entre na sua conta para ver a situação da sua assinatura.</p>
            {botao('Entrar', '/login')}
          </>
        )}
      </div>
    </div>
  )
}

export default function BemVindoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <BemVindoContent />
    </Suspense>
  )
}
