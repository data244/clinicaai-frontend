'use client'

import { useState, useRef, useEffect } from 'react'
import { iaApi, pacientesApi } from '@/lib/api'
import { Paciente } from '@/types'
import { Brain, Send, Loader2, Sparkles, FileText, User, Bot, ChevronDown } from 'lucide-react'

type Mensagem = {
  role: 'user' | 'assistant'
  content: string
  fontes?: { id: string; data: string; tipo: string; queixa: string; similaridade: number }[]
}

export default function CopilotoPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedFontes, setExpandedFontes] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    pacientesApi.list().then(setPacientes).catch(console.error)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, loading])

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || loading) return

    const novaMensagem: Mensagem = { role: 'user', content: texto }
    const historicoAtual = [...mensagens, novaMensagem]
    setMensagens(historicoAtual)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const historico = mensagens.map(m => ({ role: m.role, content: m.content }))
      const res = await iaApi.coPiloto(texto, selectedPaciente || undefined, historico)

      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: res.resposta,
        fontes: res.fontes,
      }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao consultar o copiloto')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const sugestoes = [
    'Quais são os principais diagnósticos deste paciente?',
    'Houve melhora dos sintomas nas últimas consultas?',
    'Quais medicamentos foram prescritos anteriormente?',
    'Existe padrão de recorrência nas queixas?',
  ]

  return (
    <div className="max-w-4xl flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Copiloto Clínico
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Inteligência clínica longitudinal com RAG — Claude Sonnet + pgvector
          </p>
        </div>
        <select
          className="input max-w-xs text-sm"
          value={selectedPaciente}
          onChange={e => setSelectedPaciente(e.target.value)}
        >
          <option value="">Todos os pacientes</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Copiloto pronto para ajudar</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md">
              Faça perguntas clínicas sobre seus pacientes. Selecione um paciente acima para respostas mais precisas.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {/* Fontes */}
              {msg.fontes && msg.fontes.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedFontes(expandedFontes === idx ? null : idx)}
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {msg.fontes.length} prontuário{msg.fontes.length > 1 ? 's' : ''} consultado{msg.fontes.length > 1 ? 's' : ''}
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedFontes === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedFontes === idx && (
                    <div className="mt-2 space-y-1.5">
                      {msg.fontes.map((f, fi) => (
                        <div key={fi} className="text-xs bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium text-purple-700 capitalize">{f.tipo} — {f.data}</span>
                            <span className="text-purple-400">{(f.similaridade * 100).toFixed(0)}% similar</span>
                          </div>
                          <p className="text-gray-600 truncate">{f.queixa || 'Sem queixa registrada'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-primary-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Consultando prontuários e gerando resposta...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Faça uma pergunta clínica... (Enter para enviar, Shift+Enter para nova linha)"
            rows={2}
            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
            disabled={loading}
          />
        </div>
        <button
          onClick={enviar}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-center text-xs text-gray-300 mt-2 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" /> Respostas geradas por Claude Sonnet com base nos prontuários reais
      </p>
    </div>
  )
}
