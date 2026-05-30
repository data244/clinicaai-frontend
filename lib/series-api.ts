import { request } from './api'

export interface SerieTratamento {
  id: string
  paciente_id: string
  titulo: string
  frequencia: 'semanal' | 'quinzenal'
  dia_semana: number
  hora_inicio: string
  duracao_min: number
  valor_sessao: number
  sessoes_por_mes: number
  ativa: boolean
  proximo_inicio: string
  pacientes?: { id: string; nome: string; whatsapp?: string } | null
}

export interface CicloGerado {
  consultas_criadas: number
  cobranca: { id: string; valor: number; link_pagamento?: string } | null
  link: string | null
  valor_total: number
  proximo_inicio: string
}

export const seriesApi = {
  criar: (data: {
    paciente_id: string
    titulo?: string
    frequencia: 'semanal' | 'quinzenal'
    data_hora_inicio: string
    duracao_min?: number
    valor_sessao: number
    sessoes_por_mes: number
    observacoes?: string
  }) =>
    request<{ serie: SerieTratamento; ciclo: CicloGerado }>(
      '/api/v1/series',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  listar: (ativa?: boolean, pacienteId?: string) => {
    const params = new URLSearchParams()
    if (ativa !== undefined) params.set('ativa', String(ativa))
    if (pacienteId) params.set('paciente_id', pacienteId)
    const qs = params.toString()
    return request<{ series: SerieTratamento[]; total: number }>(
      `/api/v1/series${qs ? `?${qs}` : ''}`,
    )
  },

  encerrar: (id: string) =>
    request<{ ok: boolean; id: string; ativa: boolean }>(
      `/api/v1/series/${id}/encerrar`,
      { method: 'POST' },
    ),
}
