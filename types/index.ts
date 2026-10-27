export interface Profissional {
  id: string
  nome: string
  email: string
  especialidade?: string
  conselho?: string
  numero_conselho?: string
  telefone?: string
  bio?: string
  avatar_url?: string
  foto_url?: string
  evolution_api_url?: string
  evolution_api_key?: string
  evolution_instancia?: string
  mercadopago_access_token?: string
  plano_id?: string
  status_conta?: string
  trial_expires_at?: string
  data_inicio_beta?: string
  plano?: string
  onboarding_completo?: boolean
  acesso?: AcessoConta
  // Versão dos Termos que a pessoa aceitou (null: nunca aceitou)
  termos_versao?: string | null
  // O servidor já recebe o aceite pelo painel (POST /auth/aceitar-termos)
  aceite_no_painel?: boolean
  created_at: string
}

// Situação da conta calculada pelo servidor (GET /auth/me)
export interface AcessoConta {
  completo: boolean
  situacao: 'admin' | 'ativo' | 'acesso_ate' | 'teste' | 'teste_vencido' | 'pagamento_pendente' | 'falta_cartao' | 'leitura'
  fim_teste: string | null
  acesso_ate: string | null
  registros_usados: number | null
  registros_limite: number | null
  // Teste com o cartão aprovado: a primeira cobrança é no dia em que o teste termina
  cartao?: boolean | null
  primeira_cobranca?: string | null
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
  // Paciente de exemplo (a Raquel) que toda conta nova recebe
  ficticia?: boolean
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

export interface Agendamento {
  id: string
  profissional_id: string
  paciente_id?: string
  titulo: string
  data_hora_inicio: string
  data_hora_fim: string
  tipo: string
  status: string
  observacoes?: string
  cor?: string
  pacientes?: Pick<Paciente, 'id' | 'nome' | 'telefone'>
}

export interface AuthState {
  token: string | null
  userId: string | null
  nome: string | null
  especialidade: string | null
}
