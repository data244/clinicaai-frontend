'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Paperclip, Upload, Download, Trash2 } from 'lucide-react'
import { documentosApi, DocumentoItem } from '@/lib/documentos-api'

function fmtTamanho(bytes?: number): string {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtData(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

export default function DocumentosPaciente({ pacienteId }: { pacienteId: string }) {
  const [docs, setDocs] = useState<DocumentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const r = await documentosApi.listar(pacienteId)
      setDocs(r.documentos || [])
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao listar documentos')
    } finally {
      setLoading(false)
    }
  }, [pacienteId])

  useEffect(() => { carregar() }, [carregar])

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true); setErro('')
    try {
      await documentosApi.enviar(pacienteId, file)
      await carregar()
    } catch (er: unknown) {
      setErro(er instanceof Error ? er.message : 'Erro ao enviar documento')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const baixar = async (d: DocumentoItem) => {
    try { await documentosApi.baixar(d.id, d.nome) }
    catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao baixar') }
  }

  const excluir = async (d: DocumentoItem) => {
    if (!confirm(`Excluir o documento "${d.nome}"?`)) return
    setErro('')
    try { await documentosApi.excluir(d.id); await carregar() }
    catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-400" />
          Documentos ({docs.length})
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-60"
        >
          <Upload className="w-3.5 h-3.5" /> {enviando ? 'Enviando...' : 'Enviar'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
      </div>

      {erro && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{erro}</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-4 text-center">Carregando...</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-8">
          <Paperclip className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Nenhum documento ainda</p>
          <p className="text-gray-300 text-xs mt-1">Exames, laudos e PDFs ficam guardados no Alfresco</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{d.nome}</p>
                <p className="text-xs text-gray-400">{fmtTamanho(d.tamanho)}{d.criado_em ? ` · ${fmtData(d.criado_em)}` : ''}</p>
              </div>
              <button onClick={() => baixar(d)} title="Baixar" className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => excluir(d)} title="Excluir" className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
