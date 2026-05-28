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

async function request<T>(
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

  if (res.status === 401 && auth) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clinicaai_token')
      window.location.href = '/login'
    }
    throw new ApiError(401, 'Sessão expirada. Redirecionando para o login...')
  }

  if (!res.ok) {
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
  mapaLongitudinal: (id: string) => request<any>(`/api/v1/pacientes/${id}/mapa-longitudinal`),
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

// ── IA — Transcrição, Resumo, Embeddings ──────────────────────────────────────

export const iaApi = {
  transcrever: async (audioFile: File, prontuarioId?: string): Promise<{ transcricao: string; idioma: string; prontuario_id?: string }> => {
    const token = getToken()
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
      throw new ApiError(res.status, err.detail || 'Erro na transcrição')
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
  buscar: (query: string, pacienteId?: string, limite?: number) =>
    request<any[]>('/api/v1/ia/buscar', {
      method: 'POST',
      body: JSON.stringify({ query, paciente_id: pacienteId, limite: limite ?? 5 }),
    }),
  indexar: (prontuarioId: string) =>
    request<any>(`/api/v1/ia/indexar/${prontuarioId}`, { method: 'POST' }),
  copiloto: (pergunta: string, pacienteId?: string, historico?: { role: string; content: string }[]) =>
    request<{ resposta: string; fontes: any[] }>('/api/v1/ia/copiloto', {
      method: 'POST',
      body: JSON.stringify({ pergunta, paciente_id: pacienteId, historico: historico ?? [] }),
    }),
}
