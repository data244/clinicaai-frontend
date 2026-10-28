# Política de Privacidade do Clínica.ai

Versão 1. Em vigor desde 28 de outubro de 2026.

## Resumo

- Para os dados da sua conta, nós somos o controlador. Para os dados dos seus pacientes, você é o controlador e nós somos o operador.
- O banco de dados fica em São Paulo. O servidor, os arquivos, parte do site e as IAs funcionam nos EUA.
- Não vendemos dados. Não usamos dados de pacientes para publicidade nem para treinar IA.
- Os cookies da Meta só entram se você aceitar.
- Para pedir acesso, correção, cópia ou exclusão, escreva para contato@clinicaai.net.br. Respondemos em até 15 dias.

## 1. Quem trata os dados

- Data Gestão de Arquivos Ltda., CNPJ 42.143.348/0001-88, com endereço em Rua Inverno, 195, Vila Paris, Contagem, MG, CEP 32372-110.
- Encarregado pelo tratamento de dados pessoais (LGPD, art. 41): a própria empresa acima, pelo e-mail contato@clinicaai.net.br.

## 2. Dados da sua conta

Para estes dados, nós somos o controlador (LGPD, art. 5º, VI).

| Dado | Para quê | Base legal (LGPD, art. 7º) |
|---|---|---|
| Nome, e-mail, senha, conselho e número, especialidade, telefone e bio | Criar e manter a conta e falar com você | Execução do contrato (inciso V) |
| Versão dos Termos aceita, com data e hora | Provar o aceite | Execução do contrato (V) |
| Plano, valor, situação e datas da assinatura; e-mail e código da conta enviados ao Mercado Pago | Cobrar a assinatura | Execução do contrato (V) |
| Token de acesso da sua conta do Mercado Pago, se você usar a cobrança de pacientes | Criar os links de pagamento na sua conta | Execução do contrato (V) |
| Data, hora e endereço IP de cada acesso | Segurança e guarda exigida pelo Marco Civil da Internet (Lei 12.965/2014, art. 15) | Obrigação legal (II) |
| Mensagens enviadas ao suporte, por e-mail ou pelo Telegram; no Telegram, também o seu nome e nome de usuário de lá e o código do chat | Responder você | Execução do contrato (V) |
| De qual post, anúncio ou link você chegou ao site | Saber quais canais trazem cadastros | Legítimo interesse (IX) |
| Cookies da Meta, endereço IP, navegador e página; e-mail e código da conta embaralhados (SHA-256) | Medir se os anúncios trazem cadastros | Consentimento (I), só se você aceitar no aviso de cookies |
| Nome, e-mail, WhatsApp, CRP, número de pacientes e origem, se você se inscreveu por um formulário da página | Responder a inscrição | Consentimento (I) |

A senha é guardada pelo serviço de login (Supabase). O nosso código não guarda a senha.

## 3. Dados dos seus pacientes

Para estes dados, você é o controlador e nós somos o operador (LGPD, art. 5º, VII, e art. 39).

- O que pode entrar, conforme o que você registrar: nome, CPF, data de nascimento, sexo, telefone, e-mail, WhatsApp, convênio e observações; registros de sessão; anamnese, inclusive risco e uso de substâncias; supervisões; perguntas ao Copiloto; arquivos anexados; áudio enviado para transcrição; agenda e cobranças.
- Muitos desses dados são dados pessoais sensíveis, de saúde (LGPD, art. 5º, II, e art. 11).
- Tratamos esses dados só para prestar o serviço a você. Não vendemos, não usamos para publicidade, não usamos para treinar IA e não juntamos com dados de outras contas.

## 4. Fornecedores que recebem dados, e onde

| Fornecedor | Para quê | O que recebe | Onde |
|---|---|---|---|
| Supabase | Banco de dados e login | Os dados da conta e dos pacientes, menos os arquivos | São Paulo, Brasil |
| Railway | Servidor do sistema | Todo dado passa por ele. Guarda registros técnicos por 7 dias | EUA |
| Vercel | Site | As páginas e os formulários, a caminho do servidor. Guarda registros técnicos por 1 hora | Entrada em São Paulo; funções nos EUA |
| Alfresco, em servidor dedicado | Arquivos | Os arquivos anexados e o dossiê em PDF de cada paciente. O nome do paciente aparece no nome da pasta e do arquivo. | EUA |
| Anthropic (Claude) | IA: resumo, Análise Longitudinal, mapa, Copiloto, supervisão, anamnese, importação e a assistente da Ajuda | O texto clínico. Na Análise Longitudinal, na supervisão, na anamnese e no mapa, também o nome do paciente (e o sexo, no mapa). Na importação, o conteúdo das anotações importadas, inclusive fotos. Na assistente da Ajuda, só a pergunta escrita, a tela de onde veio e a situação da assinatura (plano, datas, pagamento e quantos registros do teste foram usados), sem nome, e-mail nem dado de paciente | EUA |
| OpenAI | Busca por semelhança entre registros | O texto clínico de cada sessão salva, até 8.000 caracteres, e as perguntas ao Copiloto | EUA |
| Groq | Transcrição de áudio | O áudio que você envia. O nosso servidor não guarda o áudio | EUA |
| Mercado Pago | Assinatura e, se você usar, cobrança dos seus pacientes | E-mail e código da conta, plano e valor. O cartão e o CPF do titular são digitados num formulário do Mercado Pago dentro da nossa página (ou no site do Mercado Pago, se o formulário não carregar); nós recebemos só um código de uso único do cartão. Na cobrança de paciente: descrição, valor e e-mail do paciente | Empresa no Brasil |
| Resend | Envio de e-mails | Seu nome, seu e-mail, o texto dos avisos e as mensagens que você manda ao suporte. Para a nossa equipe: os dados de cada cadastro novo, de cada inscrição pelos formulários e de cada falha no cadastro do cartão | Empresa nos EUA |
| Telegram | Suporte pelo Telegram, só se você escolher esse canal | As mensagens que você troca com o suporte pelo Telegram, com o seu nome e nome de usuário de lá. A nossa equipe vê no Telegram o nome, o e-mail e a situação da conta ligada ao chat. Nos avisos de pedidos feitos por e-mail, só a tela de onde o pedido veio e a situação da conta, sem o texto, o nome e o e-mail | Empresa no exterior |
| Meta | Medir anúncios, só se você aceitar os cookies | Os dados da linha de cookies da seção 2 | Empresa no exterior |
| YouTube (Google) | Vídeos da Ajuda | Ao abrir a Ajuda, o seu navegador carrega os vídeos direto do YouTube, que recebe o seu endereço IP e pode gravar cookies dele | Empresa nos EUA |

- O CPF do paciente não vai para nenhuma IA.
- O que cada fornecedor de IA diz que faz com os dados recebidos pela API (páginas oficiais, lidas em 23/10/2026):
  - Anthropic: não treina modelos com esses dados; apaga em até 30 dias, ou guarda até 2 anos se houver violação das regras de uso dela;
  - OpenAI: não treina modelos com esses dados; guarda registros de abuso por até 30 dias;
  - Groq: por padrão não guarda; pode guardar até 30 dias por confiabilidade ou abuso; o contrato dela proíbe treinar com esses dados.
- Não usamos Google Analytics nem outras ferramentas de medição de visitas.

## 5. Dados fora do Brasil

Parte dos dados é tratada fora do Brasil, principalmente nos EUA, pelos fornecedores da seção 4, porque é lá que esses serviços funcionam (LGPD, art. 33).

## 6. Quem da nossa equipe acessa

- O sistema mostra a cada conta só os dados dela.
- Poucas pessoas da equipe técnica têm acesso aos painéis dos fornecedores e à área de administração, e por isso conseguem ver dados das contas.
- Só acessamos dados de uma conta a pedido do dono, para dar suporte; para cumprir a lei ou uma ordem judicial; ou para investigar uso proibido ou falha de segurança.

## 7. Por quanto tempo guardamos

| O quê | Por quanto tempo |
|---|---|
| Conta, pacientes e registros | Enquanto a conta existir, inclusive depois do cancelamento, em modo leitura. Nada é apagado por prazo. |
| Data, hora e IP de cada acesso | 6 meses (Marco Civil da Internet, art. 15) |
| Registros técnicos | Servidor, 7 dias; banco, 1 dia; site, 1 hora. Podem conter e-mails. |
| Dados de pagamento | Pelo prazo que a lei pedir |
| Suporte pelo Telegram | As conversas ficam no Telegram até serem apagadas lá. O nosso banco guarda só o código do chat, a conta ligada e a situação do atendimento, sem o texto. |

## 8. Exclusão

- Paciente:
  - "Excluir" só tira o paciente da lista (ele fica inativo);
  - "Excluir definitivo" apaga os registros dele: sessões, anamnese, supervisões, conversas do Copiloto, agenda, cobranças, documentos e arquivos, inclusive o dossiê em PDF.
- Conta: peça pelo contato@clinicaai.net.br, a partir do e-mail da conta. Excluímos em até 15 dias, inclusive os arquivos.
- Depois do cancelamento, a conta fica em modo leitura e não deixa apagar pacientes. Peça pelo contato@clinicaai.net.br que nós apagamos.
- O que estiver nos registros técnicos some quando eles vencem (seção 7).

## 9. Proteção

- Todo o caminho usa conexão criptografada (https), entre o seu navegador, o site, o servidor e os fornecedores.
- Nenhum sistema é livre de falhas. Se houver um incidente de segurança que possa causar risco ou dano relevante, avisamos você e a Autoridade Nacional de Proteção de Dados (ANPD), como manda a LGPD (art. 48).

## 10. Seus direitos

Pela LGPD (art. 18), você pode pedir:

- confirmação de que tratamos dados seus, e acesso a eles;
- correção de dados incompletos, errados ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados fora da lei;
- portabilidade, isto é, uma cópia dos seus dados para levar a outro serviço;
- eliminação dos dados tratados com o seu consentimento;
- informação sobre com quem compartilhamos os seus dados;
- informação sobre o que acontece se você não der o consentimento, e a revogação dele.

Como pedir: escreva para contato@clinicaai.net.br, a partir do e-mail da conta. Respondemos em até 15 dias (LGPD, art. 19). Você também pode reclamar à ANPD, em www.gov.br/anpd.

Se você é paciente de um psicólogo que usa o Clínica.ai, fale com ele: é ele quem decide sobre os seus dados. Se nos escrever, encaminhamos o pedido a ele.

## 11. Cookies e dados no navegador

- Essenciais: para manter você conectado, o navegador guarda o seu acesso, nome, e-mail, especialidade e código da conta (localStorage). Sem isso, o sistema não funciona.
- O navegador também guarda: as suas últimas 50 conversas com o Copiloto (perguntas e respostas), para você ver o histórico na tela; de qual link você chegou ao site; a sua escolha no aviso de cookies; e se você já viu o tour de boas-vindas. Isso fica só no seu aparelho. As conversas do Copiloto ficam até você limpar os dados do navegador.
- YouTube: os vídeos da Ajuda vêm do YouTube, que pode gravar cookies dele quando você abre a Ajuda.
- Mercado Pago: na página do cartão, o formulário do Mercado Pago carrega código dele, que pode gravar cookies e ler dados do aparelho para prevenir fraude.
- Meta: o Pixel da Meta só entra se você clicar em Aceitar no aviso de cookies. Se recusar, o site funciona do mesmo jeito. Para mudar a sua escolha, use o link "Preferências de cookies", no rodapé do site.

## 12. Menores de idade

O Clínica.ai não é para menores de 18 anos. O psicólogo pode registrar pacientes crianças e adolescentes e responde pelo consentimento dos responsáveis (LGPD, art. 14).

## 13. Mudanças nesta Política

Se mudarmos esta Política, avisamos por e-mail pelo menos 15 dias antes de a mudança valer. As versões anteriores ficam disponíveis a pedido.

## 14. Contato

- E-mail: contato@clinicaai.net.br
- Encarregado: a empresa da seção 1, no mesmo e-mail.
- ANPD: www.gov.br/anpd
