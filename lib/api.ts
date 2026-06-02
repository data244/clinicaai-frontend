const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinicaai-backend-production.up.railway.app'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('clinicaai_token')
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    // Sessão expirada / token inválido: limpa e manda para o login com aviso.
    if (res.status === 401 && auth && typeof window !== 'undefined') {
      localStorage.removeItem('clinicaai_token')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expirado=1'
      }
    }
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw new ApiError(res.status, err.detail || JSON.stringify(err))
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string; password: string; nome: string
    especialidade?: string; conselho?: string; numero_conselho?: string; telefone?: string
  }) => request<{ access_token: string; user_id: string; nome: string }>(
    '/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }, false
  ),

  login: (email: string, password: string) =>
    request<{ access_token: string; user_id: string; nome: string; especialidade: string }>(
      '/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false
    ),

  me: () => request<import('@/types').Profissional>('/api/v1/auth/me'),
}

// ── Pacientes ─────────────────────────────────────────────────────────────────

export const pacientesApi = {
  list: () => request<import('@/types').Paciente[]>('/api/v1/pacientes/'),

  create: (data: Partial<import('@/types').Paciente>) =>
    request<import('@/types').Paciente>('/api/v1/pacientes/', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) => request<import('@/types').Paciente>(`/api/v1/pacientes/${id}`),

  update: (id: string, data: Partial<import('@/types').Paciente>) =>
    request<import('@/types').Paciente>(`/api/v1/pacientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) => request<void>(`/api/v1/pacientes/${id}`, { method: 'DELETE' }),
}

// ── Prontuários ───────────────────────────────────────────────────────────────

export const prontuariosApi = {
  listByPaciente: (pacienteId: string) =>
    request<import('@/types').Prontuario[]>(`/api/v1/prontuarios/paciente/${pacienteId}`),

  create: (data: Partial<import('@/types').Prontuario>) =>
    request<import('@/types').Prontuario>('/api/v1/prontuarios/', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) => request<import('@/types').Prontuario>(`/api/v1/prontuarios/${id}`),
  update: (id: string, data: Partial<import('@/types').Prontuario>) =>
    request<import('@/types').Prontuario>(`/api/v1/prontuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ── IA — Transcrição, Resumo, Embeddings ────────────────────────────────────

export const iaApi = {
  transcrever: async (audioFile: File, prontuarioId?: string): Promise<{ transcricao: string; idioma: string; prontuario_id?: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clinicaai_token') : null
    const form = new FormData()
    form.append('audio', audioFile)
    if (prontuarioId) form.append('prontuario_id', prontuarioId)
    const res = await fetch(`${API_URL}/api/v1/ia/transcrever`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro na transcrição' }))
      throw new Error(err.detail || 'Erro na transcrição')
    }
    return res.json()
  },

  gerarResumo: (prontuarioId: string) =>
    request<{ prontuario_id: string; resumo_ia: string; modelo: string }>(
      `/api/v1/ia/prontuarios/${prontuarioId}/resumo`, { method: 'POST' }
    ),

  gerarEmbedding: (prontuarioId: string) =>
    request<{ prontuario_id: string; dims: number; status: string }>(
      `/api/v1/ia/prontuarios/${prontuarioId}/embeddings`, { method: 'POST' }
    ),

  buscaSemantica: (query: string, pacienteId?: string, limite = 5) =>
    request<{ resultados: Record<string, unknown>[]; total: number }>(
      '/api/v1/ia/busca-semantica',
      { method: 'POST', body: JSON.stringify({ query, paciente_id: pacienteId, limite }) }
    ),

  coPiloto: (
    pergunta: string,
    pacienteId?: string,
    historico: { role: string; content: string }[] = []
  ) =>
    request<{
      resposta: string
      fontes: { id: string; data: string; tipo: string; queixa: string; similaridade: number }[]
      modelo: string
      prontuarios_encontrados: number
    }>(
      '/api/v1/ia/copiloto',
      { method: 'POST', body: JSON.stringify({ pergunta, paciente_id: pacienteId, historico }) }
    ),

  analiseLongitudinal: (pacienteId: string, forceRefresh = false) =>
    request<{
      paciente: string
      total_sessoes: number
      analise: Record<string, unknown> | null
      prontuarios: Record<string, unknown>[]
      from_cache?: boolean
    }>(`/api/v1/ia/pacientes/${pacienteId}/analise-longitudinal${forceRefresh ? '?force_refresh=true' : ''}`),

  carregarHistorico: (pacienteId: string) =>
    request<{ mensagens: { role: string; content: string; timestamp?: string }[]; updated_at: string | null }>(
      `/api/v1/ia/copiloto/historico/${pacienteId}`
    ),

  salvarHistorico: (pacienteId: string, mensagens: { role: string; content: string; timestamp?: string }[]) =>
    request<{ ok: boolean }>(
      '/api/v1/ia/copiloto/historico',
      { method: 'POST', body: JSON.stringify({ paciente_id: pacienteId, mensagens }) }
    ),

  apagarHistorico: (pacienteId: string) =>
    request<{ ok: boolean }>(`/api/v1/ia/copiloto/historico/${pacienteId}`, { method: 'DELETE' }),

  backfillEmbeddings: () =>
    request<{ mensagem: string; processados: number; erros: number; total_encontrados: number }>(
      '/api/v1/ia/backfill-embeddings', { method: 'POST' }
    ),
}

// ── Agenda ────────────────────────────────────────────────────────────────────

export interface Agendamento {
  id?: string
  profissional_id?: string
  paciente_id?: string | null
  titulo: string
  data_hora_inicio: string
  data_hora_fim: string
  tipo: 'consulta' | 'retorno' | 'exame' | 'bloqueio'
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
  observacoes?: string
  cor?: string
  pacientes?: { id: string; nome: string; telefone?: string } | null
}

export const agendaApi = {
  listar: (dataInicio?: string, dataFim?: string, pacienteId?: string) => {
    const params = new URLSearchParams()
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
    if (pacienteId) params.set('paciente_id', pacienteId)
    const qs = params.toString()
    return request<{ agendamentos: Agendamento[]; total: number }>(
      `/api/v1/agenda${qs ? `?${qs}` : ''}`
    )
  },

  criar: (data: Omit<Agendamento, 'id' | 'profissional_id' | 'pacientes'>) =>
    request<Agendamento>('/api/v1/agenda', { method: 'POST', body: JSON.stringify(data) }),

  detalhe: (id: string) =>
    request<Agendamento>(`/api/v1/agenda/${id}`),

  atualizar: (id: string, data: Partial<Agendamento>) =>
    request<Agendamento>(`/api/v1/agenda/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  cancelar: (id: string) =>
    request<{ ok: boolean; id: string; status: string }>(`/api/v1/agenda/${id}`, { method: 'DELETE' }),

  gerarCobranca: (id: string, data: { valor: number; descricao?: string; data_vencimento?: string; gerar_link?: boolean }) =>
    request<{
      cobranca: { id: string; valor: number; descricao: string; data_vencimento: string; status: string; link_pagamento?: string }
      link?: string | null
      ja_existia: boolean
      aviso?: string | null
    }>(`/api/v1/agenda/${id}/gerar-cobranca`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Perfil / Configurações ────────────────────────────────────────────────────

export const perfilApi = {
  get: () => request<import('@/types').Profissional>('/api/v1/auth/me'),

  update: (data: {
    nome?: string; especialidade?: string; conselho?: string
    numero_conselho?: string; telefone?: string; bio?: string
    avatar_url?: string; evolution_api_url?: string
    evolution_api_key?: string; evolution_instancia?: string
    mercadopago_access_token?: string
  }) => request<import('@/types').Profissional>(
    '/api/v1/auth/me', { method: 'PUT', body: JSON.stringify(data) }
  ),

  changePassword: (nova_senha: string) =>
    request<{ ok: boolean; mensagem: string }>(
      '/api/v1/auth/me/senha', { method: 'POST', body: JSON.stringify({ nova_senha }) }
    ),

  testarWhatsApp: () =>
    request<{ ok: boolean; jobs: unknown[] }>('/api/v1/notificacoes/status'),
}

// ── Assinaturas ───────────────────────────────────────────────────────────────

export const assinaturaApi = {
  planos: () => request<{ planos: Record<string, unknown> }>('/api/v1/assinatura/planos', {}, false),

  status: () => request<{
    plano: string
    status_conta: string
    plano_expiracao: string | null
    ultima_assinatura: Record<string, unknown> | null
    detalhes_plano: Record<string, unknown>
  }>('/api/v1/assinatura/status'),

  retomar: () => request<{ init_point: string; plano: string }>('/api/v1/assinatura/retomar', { method: 'POST' }),

  upgrade: (novo_plano: string) => request<{ init_point: string; novo_plano: string }>(
    '/api/v1/assinatura/upgrade', { method: 'POST', body: JSON.stringify({ novo_plano }) }
  ),
}


// ── Admin (acesso restrito) ─────────────────────────────────────────────────

export interface ContaAdmin {
  id: string
  nome: string
  email: string
  conselho?: string
  numero_conselho?: string
  especialidade?: string
  status_conta: string
  plano?: string
  created_at: string
}

export const adminApi = {
  listarContas: (status?: string) =>
    request<{ contas: ContaAdmin[] }>(`/api/v1/admin/contas${status ? `?status=${status}` : ''}`),

  alterarStatus: (id: string, status_conta: string) =>
    request<{ ok: boolean; id: string; status_conta: string }>(
      `/api/v1/admin/contas/${id}/status`, { method: 'POST', body: JSON.stringify({ status_conta }) }
    ),

  resetSenha: (id: string) =>
    request<{ ok: boolean; senha_temporaria: string }>(
      `/api/v1/admin/contas/${id}/reset-senha`, { method: 'POST' }
    ),

  deletarConta: (id: string) =>
    request<{ ok: boolean; email_liberado: string }>(
      `/api/v1/admin/contas/${id}`, { method: 'DELETE' }
    ),
}
