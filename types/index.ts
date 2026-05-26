export interface Profissional {
  id: string
  nome: string
  email: string
  especialidade?: string
  conselho?: string
  numero_conselho?: string
  telefone?: string
  foto_url?: string
  plano_id?: string
  created_at: string
}

export interface Paciente {
  id: string
  profissional_id: string
  nome: string
  cpf?: string
  data_nascimento?: string
  sexo?: string
  telefone?: string
  email?: string
  whatsapp?: string
  convenio?: string
  numero_convenio?: string
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Prontuario {
  id: string
  paciente_id: string
  profissional_id: string
  tipo: string
  data_atendimento: string
  queixa_principal?: string
  anamnese?: string
  exame_fisico?: string
  hipotese_diagnostica?: string
  conduta?: string
  prescricao?: string
  observacoes?: string
  resumo_ia?: string
  created_at: string
}

export interface AuthState {
  token: string | null
  userId: string | null
  nome: string | null
  especialidade: string | null
}
