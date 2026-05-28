'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pacientesApi, prontuariosApi, iaApi } from '@/lib/api'
import { Paciente } from '@/types'
import { ArrowLeft, Mic, MicOff, Square, Save, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Fase = 'idle' | 'gravando' | 'processando' | 'revisao' | 'salvo'

const TIPOS = ['consulta', 'retorno', 'exame', 'evolucao', 'anamnese'] as const

export default function NovoProntuarioAudioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [fase, setFase] = useState<Fase>('idle')
  const [erro, setErro] = useState('')
  const [segundos, setSegundos] = useState(0)

  // Transcrição e campos
  const [transcricao, setTranscricao] = useState('')
  const [tipo, setTipo] = useState('consulta')
  const [queixa, setQueixa] = useState('')
  const [conduta, setConduta] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    pacientesApi.get(id).then(setPaciente).catch(() => {})
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [id])

  const iniciarGravacao = async () => {
    setErro('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(500)
      mediaRef.current = mr
      setFase('gravando')
      setSegundos(0)
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000)
    } catch {
      setErro('Permissão de microfone negada ou não disponível.')
    }
  }

  const pararGravacao = () => {
    if (!mediaRef.current) return
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    setFase('processando')
    mediaRef.current.onstop = async () => {
      try {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'gravacao.webm')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ia/transcrever`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData,
        })
        if (!res.ok) throw new Error('Erro na transcrição')
        const data = await res.json()
        const texto = data.transcricao || data.texto || ''
        setTranscricao(texto)
        if (texto && !queixa) setQueixa(texto.slice(0, 200))
        setFase('revisao')
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro ao transcrever áudio.')
        setFase('idle')
      }
    }
  }

  const handleSalvar = async () => {
    setSalvando(true); setErro('')
    try {
      const payload: Record<string, string> = {
        paciente_id: id,
        tipo,
        transcricao,
      }
      if (queixa) payload.queixa_principal = queixa
      if (conduta) payload.conduta = conduta
      if (observacoes) payload.observacoes = observacoes
      const novo = await prontuariosApi.create(payload)
      iaApi.gerarResumo(novo.id).catch(() => {})
      setFase('salvo')
      setTimeout(() => router.push(`/pacientes/${id}`), 1500)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar prontuário.')
    } finally {
      setSalvando(false)
    }
  }

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registro por áudio</h1>
          {paciente && <p className="text-sm text-gray-500">{paciente.nome}</p>}
        </div>
      </div>

      <div className="card space-y-6">
        {/* Gravação */}
        {(fase === 'idle' || fase === 'gravando') && (
          <div className="text-center py-6">
            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 transition-all ${
              fase === 'gravando' ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
            }`}>
              {fase === 'gravando'
                ? <MicOff className="w-10 h-10 text-red-500" />
                : <Mic className="w-10 h-10 text-gray-400" />
              }
            </div>
            {fase === 'gravando' && (
              <p className="text-2xl font-mono text-red-500 mb-2">{formatTimer(segundos)}</p>
            )}
            <p className="text-sm text-gray-500 mb-5">
              {fase === 'idle'
                ? 'Clique para iniciar a gravação da consulta'
                : 'Gravando... clique para parar'}
            </p>
            {fase === 'idle' ? (
              <button onClick={iniciarGravacao} className="btn-primary px-6 py-3 flex items-center gap-2 mx-auto">
                <Mic className="w-4 h-4" /> Iniciar gravação
              </button>
            ) : (
              <button onClick={pararGravacao} className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                <Square className="w-4 h-4" /> Parar e transcrever
              </button>
            )}
          </div>
        )}

        {/* Processando */}
        {fase === 'processando' && (
          <div className="text-center py-10">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Transcrevendo áudio com IA...</p>
          </div>
        )}

        {/* Salvo */}
        {fase === 'salvo' && (
          <div className="text-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Registro salvo!</p>
            <p className="text-sm text-gray-500 mt-1">Redirecionando...</p>
          </div>
        )}

        {/* Revisão */}
        {fase === 'revisao' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de atendimento</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {TIPOS.map(t => (<option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transcrição completa</label>
              <textarea
                value={transcricao}
                onChange={e => setTranscricao(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Transcrição do áudio..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Queixa principal (editável)</label>
              <textarea
                value={queixa}
                onChange={e => setQueixa(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Queixa principal do paciente..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conduta</label>
              <textarea
                value={conduta}
                onChange={e => setConduta(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Intervenções, orientações..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="Observações adicionais..."
              />
            </div>

            {erro && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setFase('idle'); setTranscricao('') }}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Nova gravação
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || !transcricao.trim()}
                className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar registro'}
              </button>
            </div>
          </div>
        )}

        {erro && fase !== 'revisao' && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">{erro}</p>
        )}
      </div>
    </div>
  )
}
