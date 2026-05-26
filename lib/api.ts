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
}

// ── Prontuários ───────────────────────────────────────────────────────────────

export const prontuariosApi = {
  listByPaciente: (pacienteId: string) =>
    request<import('@/types').Prontuario[]>(`/api/v1/prontuarios/paciente/${pacienteId}`),

  create: (data: Partial<import('@/types').Prontuario>) =>
    request<import('@/types').Prontuario>('/api/v1/prontuarios/', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) => request<import('@/types').Prontuario>(`/api/v1/prontuarios/${id}`),
}
