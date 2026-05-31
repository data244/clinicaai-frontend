import { request } from './api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'

function token(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('clinicaai_token')
}

export interface DocumentoItem {
  id: string
  nome: string
  tamanho?: number
  mime?: string
  criado_em?: string
}

export const documentosApi = {
  listar: (pacienteId: string) =>
    request<{ documentos: DocumentoItem[]; total: number }>(`/api/v1/documentos/paciente/${pacienteId}`),

  enviar: async (pacienteId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const t = token()
    const res = await fetch(`${API_URL}/api/v1/documentos/paciente/${pacienteId}`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: fd,
    })
    if (!res.ok) {
      const e = await res.json().catch(() => ({ detail: 'Erro ao enviar' }))
      throw new Error(e.detail || 'Erro ao enviar documento')
    }
    return res.json()
  },

  baixar: async (nodeId: string, nome: string) => {
    const t = token()
    const res = await fetch(`${API_URL}/api/v1/documentos/${nodeId}/download`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
    if (!res.ok) throw new Error('Erro ao baixar documento')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome || 'documento'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

  excluir: (nodeId: string) =>
    request<{ ok: boolean; id: string }>(`/api/v1/documentos/${nodeId}`, { method: 'DELETE' }),
}
