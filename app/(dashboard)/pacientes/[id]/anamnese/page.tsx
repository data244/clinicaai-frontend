'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ClipboardList, Loader2, Sparkles, Mic, Square, Check,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { anamneseApi, AnamneseBlocoDef } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'

export default function AnamnesePage() {
  const { id } = useParams<{ id: string }>()

  const [paciente, setPaciente] = useState('')
  const [estrutura, setEstrutura] = useState<AnamneseBlocoDef[]>([])
  const [blocos, setBlocos] = useState<Record<string, string>>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)

  // gravação
  const [gravandoEm, setGravandoEm] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const r = await anamneseApi.carregar(id as string)
      setPaciente(r.paciente)
      setEstrutura(r.estrutura)
      setBlocos(r.blocos)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar anamnese.')
    } finally { setCarregando(false) }
  }, [id])

  useEffect(() => { if (id) carregar() }, [id, carregar])

  const salvar = async (dados?: Record<string, string>) => {
    setSalvando(true)
    try {
      await anamneseApi.salvar(id as string, dados || blocos)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch { /* silencioso */ }
    finally { setSalvando(false) }
  }

  const gerar = async () => {
    setGerando(true); setErro(null)
    try {
      const r = await anamneseApi.gerar(id as string)
      setBlocos(r.blocos)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao preencher.'
      setErro(msg.includes('SEM_SESSOES')
        ? 'Ainda não há sessões registradas para preencher a anamnese. Registre a primeira sessão ou escreva aqui direto.'
        : msg)
    } finally { setGerando(false) }
  }

  const iniciarGravacao = async (chave: string) => {
    setErro(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(500)
      mediaRef.current = mr
      setGravandoEm(chave)
    } catch {
      setErro('Permissão de microfone negada ou não disponível.')
    }
  }

  const pararGravacao = (chave: string) => {
    if (!mediaRef.current) return
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    setGravandoEm(null)
    setProcessando(true)
    mediaRef.current.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'anamnese.webm')
        const res = await fetch(`${API_URL}/api/v1/ia/transcrever`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('clinicaai_token')}` },
          body: fd,
        })
        if (!res.ok) throw new Error('Erro na transcrição')
        const data = await res.json()
        const texto = (data.transcricao || data.texto || '').trim()
        if (texto) {
          const atual = blocos[chave] || ''
          const novos = { ...blocos, [chave]: atual ? `${atual}\n\n${texto}` : texto }
          setBlocos(novos)
          await salvar(novos)
        }
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro ao transcrever.')
      } finally { setProcessando(false) }
    }
  }

  const preenchidos = estrutura.filter(b => (blocos[b.chave] || '').trim()).length
  const total = estrutura.length || 1
  const pct = Math.round((preenchidos / total) * 100)

  if (carregando) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <ClipboardList className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Carregando anamnese...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">Anamnese</h1>
          </div>
          {paciente && <p className="text-sm text-gray-500 ml-7">{paciente}</p>}
        </div>
      </div>

      <div className="flex gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 my-5">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Nada aqui é obrigatório. Preencha o que fizer sentido, do jeito que preferir —
          falando, escrevendo, ou deixando que o sistema recolha o que já foi dito nas sessões.
          A anamnese continua aberta o tempo todo.
        </p>
      </div>

      {erro && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">
          {erro}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-400">{preenchidos} de {total}</span>
        </div>
        <div className="flex items-center gap-2">
          {salvo && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" /> Salvo
            </span>
          )}
          {salvando && <Loader2 className="w-3.5 h-3.5 text-gray-300 animate-spin" />}
          <button
            onClick={gerar}
            disabled={gerando}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {gerando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {gerando ? 'Recolhendo...' : 'Preencher com as sessões'}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {estrutura.map(b => {
          const valor = blocos[b.chave] || ''
          const temConteudo = !!valor.trim()
          const estaAberto = aberto === b.chave
          const gravandoAqui = gravandoEm === b.chave

          return (
            <div key={b.chave} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setAberto(estaAberto ? null : b.chave)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${temConteudo ? 'bg-indigo-400' : 'bg-gray-200'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${temConteudo ? 'text-gray-800' : 'text-gray-400'}`}>{b.titulo}</p>
                    {!estaAberto && temConteudo && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{valor.replace(/\n/g, ' ')}</p>
                    )}
                  </div>
                </div>
                {estaAberto ? <ChevronUp className="w-4 h-4 text-gray-300 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              </button>

              {estaAberto && (
                <div className="px-4 pb-4">
                  <textarea
                    value={valor}
                    onChange={e => setBlocos(p => ({ ...p, [b.chave]: e.target.value }))}
                    onBlur={() => salvar()}
                    rows={5}
                    placeholder="Escreva aqui, ou use o microfone para falar."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-y"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {gravandoAqui ? (
                      <button
                        onClick={() => pararGravacao(b.chave)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" /> Parar e transcrever
                      </button>
                    ) : (
                      <button
                        onClick={() => iniciarGravacao(b.chave)}
                        disabled={processando || !!gravandoEm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        <Mic className="w-3.5 h-3.5" /> Falar
                      </button>
                    )}
                    {processando && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcrevendo...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
