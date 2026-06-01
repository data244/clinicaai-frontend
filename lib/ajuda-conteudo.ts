export interface Artigo {
  slug: string
  titulo: string
  categoria: string
  resumo: string
  conteudo: string
}

export const categorias = [
  'Comece por aqui',
  'Pacientes & Prontuário',
  'Inteligência',
  'Agenda & Financeiro',
] as const

export const artigos: Artigo[] = [
  {
    slug: 'como-funciona',
    titulo: 'Como funciona o Clínica.ai',
    categoria: 'Comece por aqui',
    resumo: 'A ideia por trás da plataforma: a leitura longitudinal do paciente.',
    conteudo: `
## Como funciona o Clínica.ai

O Clínica.ai parte de uma ideia simples: **o valor não está em cada sessão isolada, e sim no conjunto delas ao longo do tempo**.

Cada atendimento que você registra vira parte de um histórico que se constrói sozinho. A partir dele, a plataforma:

- organiza a **evolução** do caso em ordem cronológica;
- revela **padrões e tendências** que só aparecem quando se olha o conjunto;
- ajuda a enxergar **para onde o caso parece caminhar**, não só o que já aconteceu.

É o que chamamos de **olhar longitudinal**: ver a trajetória, não o instante. Você cuida do paciente; o registro e a leitura se organizam ao seu redor.

> A inteligência **organiza e destaca** a informação. A conduta clínica é sempre sua — a plataforma não propõe diagnóstico nem tratamento.
`,
  },
  {
    slug: 'primeiros-passos',
    titulo: 'Primeiros passos',
    categoria: 'Comece por aqui',
    resumo: 'O caminho mínimo para começar a usar hoje.',
    conteudo: `
## Primeiros passos

1. **Cadastre um paciente** em *Pacientes › Novo paciente*.
2. **Registre a primeira sessão** abrindo o paciente e criando um prontuário (você pode digitar ou usar o registro por áudio).
3. Repita a cada atendimento — o histórico se constrói sozinho.
4. Depois de algumas sessões, abra o **Mapa Longitudinal** do paciente para ver a evolução e os padrões.
5. Use o **Copiloto** para perguntar coisas sobre o histórico.

Dica: quanto mais sessões registradas, mais rica fica a leitura longitudinal.
`,
  },
  {
    slug: 'pacientes',
    titulo: 'Cadastrar e acompanhar pacientes',
    categoria: 'Pacientes & Prontuário',
    resumo: 'Como criar pacientes e navegar pelo histórico.',
    conteudo: `
## Pacientes

Em **Pacientes** você cadastra e acompanha cada pessoa atendida.

- **Novo paciente**: clique em *Novo paciente* e preencha os dados básicos.
- **Ficha do paciente**: abra um paciente para ver os dados, o histórico de sessões e os atalhos para o Mapa Longitudinal e os Documentos.
- **Documentos**: anexe exames e laudos na ficha; eles passam a fazer parte do prontuário consolidado.
`,
  },
  {
    slug: 'prontuario',
    titulo: 'Registrar uma sessão (prontuário)',
    categoria: 'Pacientes & Prontuário',
    resumo: 'Como registrar atendimentos, inclusive por áudio.',
    conteudo: `
## Prontuário

Cada atendimento vira um registro no prontuário do paciente.

- **Por texto**: abra o paciente e crie um novo prontuário preenchendo os campos da sessão.
- **Por áudio**: use o *Registro por áudio* para gravar a consulta — a fala é transcrita e vira o ponto de partida do registro, que você revisa antes de salvar.
- **Prontuário consolidado**: o histórico se acumula em um documento único, cronológico e versionado, com os exames anexados como páginas.

Você sempre revisa o conteúdo antes de salvar.
`,
  },
  {
    slug: 'mapa-longitudinal',
    titulo: 'Mapa Longitudinal e Mapa de Conceitos',
    categoria: 'Inteligência',
    resumo: 'A evolução do caso e a teia dos temas do tratamento.',
    conteudo: `
## Mapa Longitudinal

É a leitura do caso por inteiro, a partir de todas as sessões registradas. Tem quatro visões:

- **Análise**: padrões, o que se repete, o que mudou e para onde o caso parece caminhar.
- **Linha do Tempo**: a trajetória do paciente em ordem cronológica.
- **Perguntas**: faça perguntas sobre o histórico; as perguntas feitas ficam no painel à direita.
- **Mapa de Conceitos**: os temas centrais do tratamento conectados em uma teia — útil para ver o caso de relance. Abra em **tela cheia** para uma visão melhor.

Quanto mais sessões, mais consistente a análise.
`,
  },
  {
    slug: 'copiloto',
    titulo: 'Copiloto Clínico',
    categoria: 'Inteligência',
    resumo: 'Converse com o histórico do paciente em linguagem natural.',
    conteudo: `
## Copiloto Clínico

O Copiloto responde perguntas sobre o histórico do paciente, citando as sessões em que se baseou.

- **Selecione o paciente** (obrigatório) antes de perguntar.
- Pergunte em linguagem natural, por exemplo: *"Houve evolução na queixa principal?"*.
- As conversas ficam guardadas **por paciente**, no painel à direita.

Importante: o Copiloto **organiza a informação**; ele não propõe diagnóstico nem conduta. Quem decide é você.
`,
  },
  {
    slug: 'agenda',
    titulo: 'Agenda e tratamento recorrente',
    categoria: 'Agenda & Financeiro',
    resumo: 'Agendamentos, visão mensal e tratamento que se repete.',
    conteudo: `
## Agenda

- **Visões**: alterne entre *Semana* e *Mês*.
- **Novo agendamento**: escolha paciente, data e tipo.
- **Tratamento recorrente**: ao agendar, marque *Repetir* (semanal ou quinzenal) e informe o valor por sessão e o número de sessões no mês. O sistema cria as sessões e gera **uma cobrança mensal adiantada** (valor por sessão × número de sessões).
- **Lembrete**: o paciente recebe a confirmação no WhatsApp um dia antes.
- **Encerrar tratamento**: interrompe a geração dos próximos meses; as sessões já criadas permanecem.
`,
  },
  {
    slug: 'cobrancas',
    titulo: 'Cobranças e lembretes',
    categoria: 'Agenda & Financeiro',
    resumo: 'Como gerar cobranças e os lembretes automáticos.',
    conteudo: `
## Cobranças

- **Gerar cobrança**: no detalhe de um agendamento, use *Gerar cobrança* para criar uma cobrança vinculada (com link de pagamento, se você tiver o Mercado Pago configurado).
- **Lembretes automáticos**: cobranças têm lembretes nos marcos D-3, D-1, D0, D+3 e D+7 (disponíveis no plano com módulo financeiro).
- **Configuração**: o token do Mercado Pago fica em *Configurações › Pagamentos*.
`,
  },
]
