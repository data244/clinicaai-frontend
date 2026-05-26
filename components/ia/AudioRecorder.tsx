'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Upload, Loader2, CheckCircle } from 'lucide-react'

interface AudioRecorderProps {
  onTranscricao: (texto: string, audioFile: File) => void
  disabled?: boolean
}

type Estado = 'idle' | 'gravando' | 'processando' | 'pronto'

export default function AudioRecorder({ onTranscricao, disabled }: AudioRecorderProps) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [duracao, setDuracao] = useState(0)
  const [erro, setErro] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const iniciarGravacao = useCallback(async () => {
    setErro('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `consulta_${Date.now()}.webm`, { type: 'audio/webm' })
        await processarAudio(file)
      }
      mr.start(1000)
      setEstado('gravando')
      setDuracao(0)
      timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000)
    } catch {
      setErro('Permissão de microfone negada ou não suportado neste browser.')
    }
  }, [])

  const pararGravacao = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
      setEstado('processando')
    }
  }, [])

  const processarAudio = async (file: File) => {
    setEstado('processando')
    try {
      const { iaApi } = await import('@/lib/api')
      const result = await iaApi.transcrever(file)
      onTranscricao(result.transcricao, file)
      setEstado('pronto')
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro na transcrição')
      setEstado('idle')
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processarAudio(file)
  }

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-3">
      {estado === 'idle' && (
        <>
          <p className="text-sm text-gray-500 font-medium">Gravar ou fazer upload do áudio da consulta</p>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={iniciarGravacao} disabled={disabled}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-lg transition-colors disabled:opacity-50">
              <Mic className="w-4 h-4" /> Gravar consulta
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
              <Upload className="w-4 h-4" /> Upload áudio
            </button>
          </div>
          <p className="text-xs text-gray-400">MP3, WAV, OGG, WebM — máx 25 MB</p>
          <input ref={fileInputRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={handleUpload} />
        </>
      )}
      {estado === 'gravando' && (
        <>
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 font-semibold">Gravando...</span>
            <span className="text-gray-500 font-mono">{fmt(duracao)}</span>
          </div>
          <button type="button" onClick={pararGravacao}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-5 rounded-lg mx-auto">
            <Square className="w-4 h-4" /> Parar e transcrever
          </button>
        </>
      )}
      {estado === 'processando' && (
        <div className="flex items-center justify-center gap-3 text-primary-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Transcrevendo com Groq Whisper...</span>
        </div>
      )}
      {estado === 'pronto' && (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Transcrição concluída!</span>
          <button type="button" onClick={() => setEstado('idle')} className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline">
            Gravar novamente
          </button>
        </div>
      )}
      {erro && <p className="text-red-500 text-sm">{erro}</p>}
    </div>
  )
}
