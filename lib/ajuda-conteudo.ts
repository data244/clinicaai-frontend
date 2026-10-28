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
  'Conta & Assinatura',
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
- revela **o que se repete e o que mudou ao longo das sessões**, algo que só aparece quando se olha o conjunto;
- ajuda a enxergar **como o trabalho evoluiu até aqui**, não só a última sessão.

É o que chamamos de **olhar longitudinal**: ver a trajetória, não o instante. Você cuida do paciente; o registro e a leitura se organizam ao seu redor.

> A inteligência **organiza e destaca** a informação. A conduta clínica é sempre sua. A IA pode auxiliar na organização de informações e na exploração de hipóteses clínicas, mas não estabelece diagnósticos nem substitui a avaliação profissional.
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
3. Repita a cada atendimento: o histórico se constrói sozinho.
4. Depois de algumas sessões, abra a **Análise Longitudinal** do paciente para ver a evolução e os padrões.
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
- **Ficha do paciente**: abra um paciente para ver os dados, o histórico de sessões e os atalhos para a Análise Longitudinal e os Documentos.
- **Documentos**: anexe laudos, relatórios e outros documentos do paciente na ficha; eles passam a fazer parte do prontuário consolidado.
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
- **Por áudio**: use o *Registro por áudio* para gravar o seu resumo, depois do atendimento: a fala é transcrita e vira o ponto de partida do registro, que você revisa antes de salvar.
- **Prontuário consolidado**: o histórico se acumula em um documento único, cronológico e versionado, com os documentos anexados como páginas.

Você sempre revisa o conteúdo antes de salvar.
`,
  },
  {
    slug: 'mapa-longitudinal',
    titulo: 'Análise Longitudinal e Mapa de Conceitos',
    categoria: 'Inteligência',
    resumo: 'A evolução do caso e a teia dos temas do tratamento.',
    conteudo: `
## Análise Longitudinal

É a leitura do caso por inteiro, a partir de todas as sessões registradas. Tem quatro visões:

- **Análise**: o que se repete, o que mudou ao longo das sessões e como o trabalho evoluiu até aqui.
- **Linha do Tempo**: a trajetória do paciente em ordem cronológica.
- **Perguntas**: faça perguntas sobre o histórico; as perguntas feitas ficam no painel à direita.
- **Mapa de Conceitos**: os temas centrais do tratamento conectados em uma teia, útil para ver o caso de relance. Abra em **tela cheia** para uma visão melhor.

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
- Pergunte em linguagem natural, por exemplo: *"Como a demanda evoluiu desde o início?"*.
- As conversas ficam guardadas **por paciente**, no painel à direita.

Importante: o Copiloto **organiza a informação**. A IA pode auxiliar na organização de informações e na exploração de hipóteses clínicas, mas não estabelece diagnósticos nem substitui a avaliação profissional. Quem decide é você.
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
- **Encerrar tratamento**: interrompe a geração dos próximos meses; as sessões já criadas permanecem.
`,
  },
  {
    slug: 'cobrancas',
    titulo: 'Cobranças',
    categoria: 'Agenda & Financeiro',
    resumo: 'Como gerar cobranças com link de pagamento.',
    conteudo: `
## Cobranças

- **Gerar cobrança**: no detalhe de um agendamento, use *Gerar cobrança* para criar uma cobrança vinculada (com link de pagamento, se você tiver o Mercado Pago configurado).
- **Configuração**: o token do Mercado Pago fica em *Configurações › Pagamentos*.
`,
  },
  {
    slug: 'ditado-voz',
    titulo: 'Ditar o registro por voz',
    categoria: 'Pacientes & Prontuário',
    resumo: 'Fale o resumo da sessão e revise o texto antes de salvar.',
    conteudo: `
## Ditar o registro por voz

Depois do atendimento, você pode falar o resumo da sessão em vez de digitar.

1. Abra o paciente e clique em **Novo registro** › **Com áudio**.
2. Na tela *Registro por áudio*, clique em **Ditar o registro** e fale.
3. Ao terminar, clique em **Parar e transcrever**. A IA transforma a fala em texto.
4. Revise e corrija o texto. Depois clique em **Salvar registro**.

Também dá para começar por **Prontuários › Novo registro › Ditado do registro**. Ali você pode ditar ou usar **Upload áudio** para enviar um arquivo já gravado (MP3, MP4, WAV, OGG ou WebM, até 25 MB).

- O áudio não fica guardado. Só o texto que você salvar.
- Nada é salvo sem a sua revisão.
- No teste grátis, cada registro salvo conta 1 dos 20.
`,
  },
  {
    slug: 'importar-anotacoes',
    titulo: 'Importar anotações antigas',
    categoria: 'Pacientes & Prontuário',
    resumo: 'Traga o histórico que já existe em texto, PDF ou foto do caderno.',
    conteudo: `
## Importar anotações antigas

Se você já atende o paciente há algum tempo, traga o histórico para o Clínica.ai.

1. Abra o paciente e clique em **Importar**.
2. Na janela *Importar histórico clínico*, escolha como enviar:
   - **Texto**: cole as anotações.
   - **Arquivo**: envie um .txt ou .pdf.
   - **Foto**: fotografe anotações feitas à mão.
3. A IA separa as anotações em sessões. Confira os **Pontos para confirmar**.
4. Clique em **Confirmar e salvar** para gravar as sessões no prontuário.

- No texto e no arquivo, a IA lê até 20.000 caracteres por envio. Se for maior, importe em partes.
- No teste grátis, cada sessão importada conta 1 dos 20 registros.
`,
  },
  {
    slug: 'teste-gratis',
    titulo: 'Teste grátis e limite de registros',
    categoria: 'Conta & Assinatura',
    resumo: 'Como funcionam os 14 dias grátis e os 20 registros do teste.',
    conteudo: `
## Teste grátis

São **14 dias grátis**. Para começar, você informa o cartão no formulário do Mercado Pago. Nada é cobrado durante o teste.

- O teste só começa depois do cartão.
- No 15º dia, o Mercado Pago cobra **R$ 99**. Depois, todo mês no mesmo dia.
- Você recebe um e-mail 3 dias antes da primeira cobrança e outro na véspera.
- Cancele antes do fim do teste e não paga nada. Veja *Cancelar a assinatura*.

### Limite de 20 registros

No teste, você pode salvar até **20 registros**. Registro é cada prontuário salvo: digitado, ditado por áudio ou cada sessão importada. Os registros da Raquel, a paciente fictícia de exemplo, não contam.

No alto da tela aparece quanto falta, por exemplo *Teste · 10 dias · 3 de 20 registros*.

Chegou aos 20 antes do fim do teste? Clique em **Começar a assinatura agora**. A cobrança de R$ 99 é feita no mesmo dia, o limite acaba e as próximas cobranças passam a cair todo mês nesse dia.
`,
  },
  {
    slug: 'cobranca',
    titulo: 'Cobrança da assinatura',
    categoria: 'Conta & Assinatura',
    resumo: 'Quando e como a mensalidade é cobrada.',
    conteudo: `
## Cobrança da assinatura

A assinatura custa **R$ 99 por mês**, no cartão, pelo Mercado Pago.

- **Primeira cobrança**: no 15º dia, depois do teste grátis. Se você clicar em *Começar a assinatura agora*, é no mesmo dia.
- **Depois**: todo mês, no mesmo dia da primeira cobrança.

### Onde ver a sua assinatura

Vá em **Configurações** e abra a aba **Minha assinatura**. Ali aparece a situação da conta e a data da próxima cobrança. No teste, aparecem também o último dia grátis e quantos registros você já usou.

### Trocar o cartão ou o plano

Ainda não dá para trocar o cartão nem o plano pela tela. Escreva para contato@clinicaai.net.br, a partir do e-mail da conta, ou use **Falar com uma pessoa** aqui na Ajuda.
`,
  },
  {
    slug: 'cartao-recusado',
    titulo: 'Pagamento não aprovado',
    categoria: 'Conta & Assinatura',
    resumo: 'O que fazer quando o cartão é recusado.',
    conteudo: `
## Pagamento não aprovado

**Na hora de assinar**: se o cartão não for aceito, nada é cobrado. Confira os dados ou tente outro cartão.

**Na cobrança do mês**: você recebe um e-mail com o botão **Atualizar o pagamento**. Ele leva para **Configurações › Minha assinatura**, onde aparece o aviso de que o último pagamento não foi aprovado.

1. Clique em **Concluir pagamento**.
2. Informe o cartão no formulário do Mercado Pago.

A nova cobrança é feita no mesmo dia.

- Você tem **10 dias** para resolver. Nesse tempo, a conta continua funcionando normalmente.
- Depois disso, a conta passa para o **modo leitura**: você vê tudo o que registrou, mas não cria nem altera nada. Nada é apagado.
`,
  },
  {
    slug: 'cancelar',
    titulo: 'Cancelar a assinatura',
    categoria: 'Conta & Assinatura',
    resumo: 'Como cancelar e o que acontece com os seus dados.',
    conteudo: `
## Cancelar a assinatura

1. Vá em **Configurações** e abra a aba **Minha assinatura**.
2. Clique em **Cancelar assinatura**.
3. Confirme em **Sim, cancelar**. Se mudar de ideia, clique em *Manter assinatura*.

### O que acontece depois

- **No teste grátis**: nada é cobrado.
- **Depois de pagar**: o acesso completo continua até o fim do período já pago. Depois, a conta passa para o **modo leitura**: você vê e baixa tudo o que registrou, mas não cria nem altera nada, e a IA não roda.
- **Nada é apagado.** Para voltar, clique em **Assinar**.

### Reembolso

Cancelou em até **7 dias depois da primeira cobrança**? Cancele em *Minha assinatura* e escreva para contato@clinicaai.net.br pedindo o reembolso. Fora desse prazo, os meses já pagos não são devolvidos.
`,
  },
  {
    slug: 'sigilo-lgpd',
    titulo: 'Sigilo e proteção dos dados (LGPD)',
    categoria: 'Conta & Assinatura',
    resumo: 'Onde ficam os dados e quem pode ver.',
    conteudo: `
## Sigilo e proteção dos dados

- **Só você vê a sua conta.** O sistema mostra a cada conta apenas os dados dela.
- **Acesso da equipe**: poucas pessoas da equipe técnica têm acesso, e só quando você pede suporte, por obrigação legal ou por segurança.
- **Não vendemos dados.** Não usamos dados de pacientes para publicidade nem para treinar IA.
- **IA**: a Anthropic, que fornece a IA, não treina com os seus dados e apaga o que recebe em até 30 dias.
- **Onde ficam**: o banco de dados fica em São Paulo. O servidor, os arquivos, parte do site e as IAs ficam nos Estados Unidos.
- **Conexão protegida**: todo o caminho usa https.
- **Por quanto tempo**: os dados ficam guardados enquanto a conta existir.

### Seus pedidos pela LGPD

Para pedir acesso, correção, cópia ou exclusão, escreva para contato@clinicaai.net.br, a partir do e-mail da conta. Respondemos em até 15 dias.

Os detalhes estão na *Política de Privacidade*.

A Marina, assistente desta Ajuda, não vê os seus pacientes. Não escreva dados de pacientes nas perguntas.
`,
  },
  {
    slug: 'exportar-dados',
    titulo: 'Baixar e exportar os seus dados',
    categoria: 'Conta & Assinatura',
    resumo: 'Prontuário em PDF por paciente ou todos os dados de uma vez.',
    conteudo: `
## Baixar e exportar os seus dados

### Por paciente

Abra o paciente. No quadro **Documentos**, clique em **Prontuário consolidado** para abrir o PDF com o histórico do caso. O PDF só existe depois do primeiro atendimento salvo. Os documentos anexados têm o botão **Baixar**.

### Todos os dados de uma vez

Escreva para contato@clinicaai.net.br, a partir do e-mail da conta, pedindo a cópia. Entregamos em até 15 dias.

### Guarda dos registros

Pela Resolução CFP 001/2009, os registros devem ser guardados por pelo menos 5 anos. Essa guarda é responsabilidade de quem atende. Mesmo depois de cancelar, no modo leitura, você continua podendo baixar os prontuários.
`,
  },
  {
    slug: 'falar-com-suporte',
    titulo: 'Falar com o suporte',
    categoria: 'Conta & Assinatura',
    resumo: 'Marina na hora, Telegram para conversar com uma pessoa, e-mail para pedidos formais.',
    conteudo: `
## Falar com o suporte

Aqui na **Ajuda**, você escolhe como pedir ajuda:

- **Marina**: a assistente da Ajuda responde na hora, com os artigos e a situação da sua assinatura. Ela não vê os seus pacientes.
- **Telegram**: para conversar com uma pessoa do suporte. Em *Prefere falar com uma pessoa?*, clique em **Falar pelo Telegram** e depois em **Abrir o Telegram**. A resposta chega no próprio Telegram, em dias úteis.
- **E-mail**: para pedidos formais e para acompanhar por escrito. Clique em **Enviar por e-mail** ou escreva para contato@clinicaai.net.br, a partir do e-mail da conta. Respondemos no e-mail da sua conta, em dias úteis.

### Pelo Telegram

- O link de **Abrir o Telegram** vale por 30 minutos e liga o chat à sua conta. Não repasse a outra pessoa.
- Mande só texto. Fotos, áudios e arquivos não são aceitos.
- Para desligar o chat da sua conta, mande /desvincular no Telegram.
- Pedidos sobre os seus dados pela LGPD (acesso, cópia ou exclusão) vão pelo e-mail. Veja *Sigilo e proteção dos dados*.

### Sem dados de pacientes

Em nenhum canal envie nomes de pacientes, trechos de prontuário, transcrições de sessão ou prints com dados de pacientes. O suporte resolve dúvidas técnicas e de assinatura sem precisar deles.
`,
  },
]
