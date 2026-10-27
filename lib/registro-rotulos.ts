// Nomes dos campos e tipos do registro de sessão (Resolução CFP 001/2009, art. 2º; aprovado em 27/10).
// As colunas do banco não mudam: só o nome que aparece na tela.
export const CAMPOS_REGISTRO = {
  queixa_principal: { rotulo: 'Demanda e objetivos', exemplo: 'O que a pessoa trouxe e o que vocês combinaram trabalhar' },
  anamnese: { rotulo: 'Registro da sessão', exemplo: 'O que aconteceu na sessão e como o trabalho evoluiu' },
  exame_fisico: { rotulo: 'Procedimentos e técnicas', exemplo: 'Técnicas, instrumentos e intervenções usados' },
  hipotese_diagnostica: { rotulo: 'Hipóteses clínicas', exemplo: 'Só se for útil ao trabalho' },
  conduta: { rotulo: 'Plano de trabalho', exemplo: 'Próximos passos e o que fica para a próxima sessão' },
  prescricao: { rotulo: 'Encaminhamento ou encerramento', exemplo: 'Para quem, por quê, ou o motivo do encerramento' },
  observacoes: { rotulo: 'Observações', exemplo: '' },
} as const

// Nome no formulário: o campo opcional avisa que é opcional
export function rotuloFormulario(campo: keyof typeof CAMPOS_REGISTRO): string {
  const { rotulo } = CAMPOS_REGISTRO[campo]
  return campo === 'hipotese_diagnostica' ? `${rotulo} (opcional)` : rotulo
}

export const TIPOS_REGISTRO = ['consulta', 'anamnese', 'avaliacao', 'devolutiva', 'encaminhamento', 'encerramento'] as const

// Valor antigo -> tipo da lista que tem o mesmo nome na tela
const EQUIVALENTE: Record<string, string> = { retorno: 'consulta', evolucao: 'consulta', exame: 'avaliacao' }

const NOME_TIPO: Record<string, string> = {
  consulta: 'Sessão', retorno: 'Sessão', evolucao: 'Sessão',
  anamnese: 'Avaliação inicial', avaliacao: 'Avaliação', exame: 'Avaliação',
  devolutiva: 'Devolutiva', encaminhamento: 'Encaminhamento', encerramento: 'Encerramento',
}

export function nomeTipo(tipo?: string | null): string {
  if (!tipo) return 'Sessão'
  return NOME_TIPO[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1)
}

// Opções do seletor: o valor antigo fica no lugar do tipo de mesmo nome, para não ser regravado
export function opcoesTipo(atual?: string): string[] {
  const lista: string[] = TIPOS_REGISTRO.map(t => (atual && EQUIVALENTE[atual] === t ? atual : t))
  if (atual && !lista.includes(atual)) lista.push(atual)
  return lista
}
