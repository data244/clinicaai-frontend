'use client'

import { useEffect, useState } from 'react'
import { suporteApi } from '@/lib/api'
import { Copy, Check, Loader2, MessageCircle, Send } from 'lucide-react'

// Suporte (Leo, 23/10): o endereço com botão de copiar, porque o link de e-mail não abre
// nada em computador sem programa de e-mail, e o "Falar com o suporte" para quem está logado.
// O Leo lê a caixa uma vez por dia (VENDAS.md).
export const EMAIL_SUPORTE = 'contato@clinicaai.net.br'

export function EnderecoSuporte({ texto = 'Precisa de ajuda? Escreva para' }: { texto?: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL_SUPORTE)
    } catch {
      // Navegador sem acesso à área de transferência: copia pelo jeito antigo
      const campo = document.createElement('textarea')
      campo.value = EMAIL_SUPORTE
      document.body.appendChild(campo)
      campo.select()
      document.execCommand('copy')
      campo.remove()
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <p className="text-sm text-gray-500 text-center leading-relaxed">
      {texto}{' '}
      <a href={`mailto:${EMAIL_SUPORTE}`} className="font-medium text-gray-700 hover:underline whitespace-nowrap">{EMAIL_SUPORTE}</a>
      <button
        type="button" onClick={copiar}
        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-white transition-colors align-middle"
      >
        {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </p>
  )
}

export function FalarComSuporte({ pagina, abertoDeInicio = false, mensagemInicial = '', rotulo = 'Falar com o suporte' }: {
  pagina: string; abertoDeInicio?: boolean; mensagemInicial?: string; rotulo?: string
}) {
  const [aberto, setAberto] = useState(abertoDeInicio)
  const [mensagem, setMensagem] = useState(mensagemInicial)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const enviar = async () => {
    if (!mensagem.trim()) { setErro('Escreva a mensagem.'); return }
    setEnviando(true)
    setErro('')
    try {
      await suporteApi.enviar(mensagem.trim(), pagina)
      setEnviado(true)
    } catch (e: unknown) {
      setErro(e instanceof Error && e.message ? e.message : `Não foi possível enviar agora. Escreva para ${EMAIL_SUPORTE}.`)
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="bg-green-50 text-green-800 text-sm px-3 py-2.5 rounded-lg border border-green-200 text-left">
        Mensagem enviada. Respondemos assim que possível, no e-mail da sua conta.
      </div>
    )
  }

  if (!aberto) {
    return (
      <button
        type="button" onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {rotulo}
      </button>
    )
  }

  return (
    <div className="text-left w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor={`suporte-${pagina}`}>
        Conte o que aconteceu
      </label>
      <textarea
        id={`suporte-${pagina}`} value={mensagem} onChange={e => setMensagem(e.target.value)}
        maxLength={3000} rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Não escreva dados de pacientes. Respondemos assim que possível, no e-mail da sua conta.
      </p>
      {erro && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mb-3">{erro}</div>
      )}
      <button
        type="button" onClick={enviar} disabled={enviando}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar ao suporte
      </button>
    </div>
  )
}

// Suporte humano pelo Telegram (Leo, 28/10). O servidor diz se o bot está ligado; desligado,
// o botão some. O link leva um código de uso único que liga o chat à conta, sem dado pessoal.
// Dois passos (gerar e depois abrir) porque o celular bloqueia janela aberta depois de esperar.
export function FalarPeloTelegram() {
  const [disponivel, setDisponivel] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [link, setLink] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    suporteApi.telegram().then(r => setDisponivel(!!r.disponivel)).catch(() => setDisponivel(false))
  }, [])

  const gerar = async () => {
    setGerando(true)
    setErro('')
    try {
      const r = await suporteApi.linkTelegram()
      setLink(r.link)
    } catch (e: unknown) {
      setErro(e instanceof Error && e.message ? e.message : 'O Telegram não respondeu agora. Tente de novo em alguns minutos ou use o e-mail.')
    }
    setGerando(false)
  }

  if (!disponivel) return null

  if (link) {
    return (
      <div className="text-left w-full bg-sky-50 border border-sky-200 rounded-lg px-3 py-3">
        <p className="text-sm text-gray-700 leading-relaxed mb-1">
          Pelo Telegram, atendemos dúvidas técnicas e de assinatura. Mande só texto. Respondemos por lá, assim que possível.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Não envie nomes de pacientes, trechos de prontuário nem prints com dados de pacientes.
        </p>
        <a
          href={link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
        >
          <Send className="w-4 h-4" />
          Abrir o Telegram
        </a>
        <p className="text-xs text-gray-500 mt-2">
          O link vale por 30 minutos e liga o chat à sua conta. Não repasse a outra pessoa.
        </p>
      </div>
    )
  }

  return (
    <div className="text-left">
      <button
        type="button" onClick={gerar} disabled={gerando}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Falar pelo Telegram
      </button>
      {erro && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200 mt-2">{erro}</div>
      )}
    </div>
  )
}
