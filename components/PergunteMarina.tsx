'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Loader2, BookOpen, UserRound } from 'lucide-react'
import { suporteApi, ApiError, type RespostaMarina, type AvaliacaoMarina } from '@/lib/api'
import { artigos } from '@/lib/ajuda-conteudo'
import { EnderecoSuporte, FalarComSuporte, FalarPeloTelegram } from '@/components/Suporte'

// Marina na Central de Ajuda (Leo, 28/10): responde com os artigos da Ajuda e a situação da
// conta, sem ver pacientes. Não resolveu: "Falar com uma pessoa" abre o formulário do suporte
// que já existe, com a pergunta escrita, e a pessoa revisa antes de enviar.
const MD = {
  p: (p: any) => <p className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0" {...p} />,
  ul: (p: any) => <ul className="list-disc pl-5 space-y-1 mb-2 text-sm text-gray-700" {...p} />,
  ol: (p: any) => <ol className="list-decimal pl-5 space-y-1 mb-2 text-sm text-gray-700" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-gray-900" {...p} />,
}

export default function PergunteMarina({ onAbrirArtigo }: { onAbrirArtigo: (slug: string) => void }) {
  const [pergunta, setPergunta] = useState('')
  const [perguntada, setPerguntada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [resposta, setResposta] = useState<RespostaMarina | null>(null)
  const [erro, setErro] = useState('')
  const [avaliada, setAvaliada] = useState<AvaliacaoMarina | null>(null)
  // O formulário do suporte remonta com a pergunta escrita quando a chave muda
  const [formulario, setFormulario] = useState({ chave: 0, texto: '' })
  const suporteRef = useRef<HTMLDivElement>(null)

  const perguntar = async () => {
    const texto = pergunta.trim()
    if (!texto || carregando) return
    setCarregando(true)
    setResposta(null)
    setErro('')
    setAvaliada(null)
    setPerguntada(texto)
    try {
      // Veio de uma dica da Marina: a tela de origem entra na contagem das dúvidas
      const de = new URLSearchParams(window.location.search).get('de')
      setResposta(await suporteApi.perguntar(texto, de || 'ajuda'))
      setPergunta('')
    } catch (e: unknown) {
      setErro(e instanceof ApiError && e.status === 429 && e.message
        ? e.message
        : 'Não consegui responder agora. Você pode mandar a pergunta para uma pessoa.')
    }
    setCarregando(false)
  }

  const avaliar = (avaliacao: AvaliacaoMarina) => {
    setAvaliada(avaliacao)
    if (resposta) suporteApi.avaliar(resposta.id, avaliacao).catch(() => {})
  }

  const falarComPessoa = () => {
    avaliar('pediu_pessoa')
    setFormulario(f => ({ chave: f.chave + 1, texto: perguntada }))
    setTimeout(() => suporteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  const artigosDaResposta = (resposta?.artigos ?? [])
    .map(s => artigos.find(a => a.slug === s))
    .filter((a): a is (typeof artigos)[number] => !!a)

  return (
    <div className="mb-6 sm:ml-12 max-w-2xl bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <img src="/marina.png" alt="" className="w-10 h-10 rounded-full object-cover object-top border-2 border-indigo-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Pergunte à Marina</p>
          <p className="text-xs text-gray-500">Assistente virtual. Tira dúvidas sobre o uso do sistema e a sua assinatura. Não vê os seus pacientes.</p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); perguntar() }}>
        <label htmlFor="pergunta-marina" className="sr-only">Sua pergunta</label>
        <textarea
          id="pergunta-marina" value={pergunta} onChange={e => setPergunta(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); perguntar() } }}
          maxLength={1000} rows={2}
          placeholder="Ex.: quando vou ser cobrada? Como registro uma sessão por áudio?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 mt-1.5">
          <p className="text-xs text-gray-500">Não escreva dados de pacientes.</p>
          <button
            type="submit" disabled={carregando || !pergunta.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {carregando && <Loader2 className="w-4 h-4 animate-spin" />}
            Perguntar
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {carregando && <p className="text-sm text-gray-500 mt-4">A Marina está procurando a resposta...</p>}

        {(resposta || erro) && (
          <div className="mt-4 bg-indigo-50/60 border border-indigo-100 rounded-lg p-3.5">
            <p className="text-xs text-gray-500 mb-2 break-words">Você perguntou: “{perguntada}”</p>
            {erro
              ? <p className="text-sm text-gray-700">{erro}</p>
              : (
                <ReactMarkdown components={MD} disallowedElements={['a', 'img']} unwrapDisallowed>
                  {resposta!.resposta}
                </ReactMarkdown>
              )}

            {artigosDaResposta.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {artigosDaResposta.map(a => (
                  <button
                    key={a.slug} type="button" onClick={() => onAbrirArtigo(a.slug)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    {a.titulo}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-indigo-100">
              {resposta && !resposta.encaminhar && !avaliada && (
                <>
                  <span className="text-xs text-gray-600">Isso resolveu?</span>
                  <button type="button" onClick={() => avaliar('resolveu')}
                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">Sim</button>
                  <button type="button" onClick={() => avaliar('nao_resolveu')}
                    className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">Não</button>
                </>
              )}
              {avaliada === 'resolveu' && <span className="text-xs text-green-700">Que bom! Se precisar, é só perguntar de novo.</span>}
              {avaliada === 'nao_resolveu' && <span className="text-xs text-gray-600">Obrigada por avisar. Uma pessoa pode ajudar:</span>}
              {(erro || resposta?.encaminhar || avaliada === 'nao_resolveu') && avaliada !== 'pediu_pessoa' && (
                <button type="button" onClick={falarComPessoa}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                  <UserRound className="w-3.5 h-3.5" />
                  Falar com uma pessoa
                </button>
              )}
              {resposta && !resposta.encaminhar && !avaliada && (
                <button type="button" onClick={falarComPessoa}
                  className="text-xs text-indigo-700 hover:underline sm:ml-auto">Falar com uma pessoa</button>
              )}
              {avaliada === 'pediu_pessoa' && <span className="text-xs text-gray-600">Revise a mensagem abaixo e toque em Enviar ao suporte.</span>}
            </div>
          </div>
        )}
      </div>

      <div ref={suporteRef} className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-700 font-medium mb-3">Prefere falar com uma pessoa?</p>
        <div className="flex flex-wrap items-start gap-2">
          <FalarComSuporte
            key={formulario.chave} pagina={formulario.chave > 0 ? 'ajuda/marina' : 'ajuda'} rotulo="Enviar por e-mail"
            abertoDeInicio={formulario.chave > 0} mensagemInicial={formulario.texto}
          />
          <FalarPeloTelegram />
        </div>
        <div className="mt-3 [&>p]:text-left">
          <EnderecoSuporte texto="Ou escreva para" />
        </div>
      </div>
    </div>
  )
}
