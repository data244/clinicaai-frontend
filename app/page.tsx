import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Clock, Network, Check, ShieldCheck, MicOff, UserCheck, Lock } from 'lucide-react'
import DataCobranca from '@/components/DataCobranca'

// Página inicial (Rascunho_Pagina_e_Emails_v2.md, seção 1, aprovado pelo Leo em 20/10).
// Cada chave abaixo liga um trecho que só pode aparecer quando for verdade no sistema.

// A Raquel, paciente fictícia, pronta em toda conta nova (item 3 do prompt de 20/10)
const RAQUEL_NA_CONTA = false
// As três telas da Raquel, com "Paciente fictícia" escrito na imagem, em /public/home
const TELAS_RAQUEL: { src: string; legenda: string }[] = []
// Coluna acesso_ate no banco de produção: quem cancela depois de pagar usa até o fim do mês pago
const ACESSO_ATE_NO_BANCO = false
// SQL de segurança de 17/10 rodado e compartilhamento de dados desligado na OpenAI e na Groq
const SIGILO_CONFERIDO = false
// contato@clinicaai.net.br recebendo e-mail
const CONTATO_RECEBE = false
// Termos de Uso e Política de Privacidade no ar (Etapa 5)
const TERMOS_NO_AR = false

export const metadata: Metadata = {
  title: 'Clínica.ai · O prontuário que lê o caso inteiro para você',
  description:
    'O Clínica.ai relê todas as sessões do paciente e mostra o que se repete, o que mudou e onde o caso está, antes do próximo atendimento. 14 dias grátis, depois R$ 99 por mês.',
}

// ---------------------------------------------------------------------------
// Peças da página
// ---------------------------------------------------------------------------

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-16 sm:py-20 px-4 scroll-mt-16 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  )
}

function Comecar({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/cadastro"
      className={`inline-block bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md ${className}`}
    >
      Começar 14 dias grátis
    </Link>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
        {n}
      </div>
      <div className="pt-1">
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
      <span className="text-slate-700 leading-relaxed"><strong className="text-slate-900">{title}</strong> {children}</span>
    </li>
  )
}

function Confianca({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-slate-200 last:border-0">
      <summary className="list-none cursor-pointer py-4 flex justify-between items-start gap-4 hover:text-primary-700 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-slate-800">{q}</span>
        <span className="text-primary-600 text-xl leading-none flex-shrink-0 mt-0.5 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-slate-600 leading-relaxed text-sm">{children}</div>
    </details>
  )
}

// O que a Análise Longitudinal monta para cada paciente (seção 1.3)
const LEITURAS = [
  { Icon: TrendingUp, titulo: 'Análise Longitudinal', texto: 'os temas que se repetem ao longo das sessões, com frequência e tendência.' },
  { Icon: Clock, titulo: 'Linha do tempo', texto: 'o que aconteceu no caso, sessão a sessão.' },
  { Icon: Network, titulo: 'Mapa de conceitos', texto: 'como os temas do caso se ligam.' },
]

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const telaAbertura = TELAS_RAQUEL[0]

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Barra do topo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="text-slate-900 font-bold text-lg tracking-tight">
            Clínica<span className="text-primary-600">.ai</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-sm">
            {RAQUEL_NA_CONTA && (
              <a href="#raquel" className="hidden md:inline text-slate-600 hover:text-slate-900 transition-colors">Ver o caso da Raquel</a>
            )}
            <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Entrar</Link>
            <Link
              href="/cadastro"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Começar 14 dias grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* 1.1 Abertura */}
      <div className="bg-slate-900 text-white pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
              O prontuário que lê o caso inteiro para você.
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-10">
              Um prontuário comum guarda o que você escreveu. O Clínica.ai relê todas as sessões do paciente e mostra
              o que se repete, o que mudou e onde o caso está, antes do próximo atendimento.
            </p>
            <Comecar />
            <p className="text-slate-400 text-sm mt-4">14 dias grátis. Depois, R$ 99 por mês. Cancele no teste e não paga nada.</p>
            {RAQUEL_NA_CONTA && (
              <a href="#raquel" className="inline-block text-primary-300 hover:text-primary-200 text-sm font-medium mt-6 underline underline-offset-4">
                Ver o caso da Raquel (paciente fictícia)
              </a>
            )}
          </div>
          {telaAbertura ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={telaAbertura.src} alt={telaAbertura.legenda} className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10" />
          ) : (
            <div className="space-y-4">
              {LEITURAS.map(({ Icon, titulo, texto }) => (
                <div key={titulo} className="flex gap-4 bg-white/5 ring-1 ring-white/10 rounded-2xl p-5">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/20 text-primary-300 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-white block">{titulo}</strong>
                    {texto.charAt(0).toUpperCase() + texto.slice(1)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1.2 O problema */}
      <Section>
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">O caso está todo anotado. Falta alguém ler.</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-4">
            Depois de 20 sessões, tudo o que importa está no prontuário, espalhado em 20 registros. Para lembrar o que
            mudou desde o terceiro mês, você teria que reler tudo. E ninguém tem esse tempo entre um atendimento e outro.
          </p>
          <p className="text-slate-600 text-lg leading-relaxed">
            O Clínica.ai faz essa leitura por você e entrega o caso organizado. A interpretação clínica continua sendo sua.
          </p>
        </div>
      </Section>

      {/* 1.3 O caso da Raquel */}
      {RAQUEL_NA_CONTA && (
        <Section id="raquel" className="bg-slate-50">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Veja o que o Clínica.ai faz com um caso inteiro.</h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-6 max-w-3xl">
            A Raquel é uma paciente fictícia, criada para mostrar o sistema. Nenhum dado real. A partir das sessões dela,
            o Clínica.ai monta:
          </p>
          <ul className="space-y-3 mb-10 max-w-3xl">
            {LEITURAS.map(({ titulo, texto }) => <Item key={titulo} title={`${titulo}:`}>{texto}</Item>)}
          </ul>
          {TELAS_RAQUEL.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {TELAS_RAQUEL.map(t => (
                <figure key={t.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.src} alt={t.legenda} className="w-full rounded-xl shadow-lg ring-1 ring-slate-200" />
                  <figcaption className="text-sm text-slate-500 mt-2">{t.legenda}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <p className="text-slate-700 font-medium mb-6">
            A Raquel já vem pronta na sua conta. Entre, abra o caso dela e veja tudo isso antes do seu primeiro registro.
          </p>
          <Comecar />
        </Section>
      )}

      {/* 1.4 Como funciona */}
      <Section className={RAQUEL_NA_CONTA ? '' : 'bg-slate-50'}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Como funciona</h2>
        <div className="space-y-8 max-w-3xl">
          <Step n={1} title="Registre do seu jeito.">
            Digite, cole suas anotações, mande a foto do caderno ou fale por 3 minutos depois do atendimento.
            O áudio é o seu resumo, sobre a sessão.
          </Step>
          <Step n={2} title="Traga o histórico.">
            Anotações antigas entram por texto, arquivo .txt ou .pdf, ou foto. O caso já começa com o que você tem.
          </Step>
          <Step n={3} title="Abra o caso antes do atendimento.">
            A cada registro, a Análise Longitudinal relê o caso inteiro. Veja os temas que se repetem, a linha do tempo
            e o que mudou. Se quiser, pergunte ao Copiloto sobre o histórico do paciente.
          </Step>
        </div>
      </Section>

      {/* 1.5 Plano e preço */}
      <Section id="preco" className={RAQUEL_NA_CONTA ? 'bg-slate-50' : ''}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Um plano, tudo incluído: R$ 99 por mês.</h2>
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <ul className="lg:col-span-3 space-y-4">
            <Item title="Prontuário:">registros por texto, foto ou áudio seu.</Item>
            <Item title="Análise Longitudinal">de cada paciente: temas que se repetem, linha do tempo e mapa de conceitos.</Item>
            <Item title="Copiloto:">perguntas sobre o histórico do caso, com resposta baseada no que você registrou.</Item>
            <Item title="Preparação para a supervisão:">o caso organizado para você levar ao seu supervisor.</Item>
            <Item title="Anamnese">preenchida com o que já foi dito nas sessões, para você revisar.</Item>
            <Item title="Importação de histórico:">texto, arquivo .txt ou .pdf, ou foto de anotações à mão.</Item>
            <Item title="Agenda">dos seus atendimentos.</Item>
            <Item title="Cobrança por link de pagamento">do Mercado Pago, na sua própria conta.</Item>
          </ul>
          <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-7 shadow-xl">
            <p className="text-4xl font-bold mb-1">R$ 99<span className="text-lg font-medium text-slate-400"> por mês</span></p>
            <p className="text-primary-300 font-semibold mb-5">14 dias grátis</p>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              No cadastro, você informa o cartão pelo Mercado Pago. Nada é cobrado no teste. A primeira cobrança, de
              R$ 99, acontece <DataCobranca />, e você recebe um aviso por e-mail 3 dias antes. Cancele antes, em
              &quot;Minha assinatura&quot;, e não paga nada. No teste, você faz até 20 registros.
              {RAQUEL_NA_CONTA && ' A Raquel não conta.'}
            </p>
            <Link
              href="/cadastro"
              className="block text-center bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
            >
              Começar 14 dias grátis
            </Link>
          </div>
        </div>
      </Section>

      {/* 1.6 Confiança */}
      <Section className="bg-slate-50">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Feito para as regras da profissão.</h2>
        <div className={`grid sm:grid-cols-2 ${SIGILO_CONFERIDO ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          <Confianca icon={<ShieldCheck className="w-5 h-5" />} title="Guarda do prontuário.">
            A Resolução CFP nº 001/2009 pede o registro documental do atendimento e a guarda por no mínimo 5 anos.
            No Clínica.ai, nada é apagado automaticamente: seus registros ficam guardados mesmo se você deixar de assinar.
          </Confianca>
          <Confianca icon={<MicOff className="w-5 h-5" />} title="Sem gravar a sessão.">
            O áudio do Clínica.ai é o seu memo, gravado por você depois do atendimento, sobre a sessão.
          </Confianca>
          <Confianca icon={<UserCheck className="w-5 h-5" />} title="A IA apoia, você decide.">
            O Clínica.ai não faz diagnóstico e não substitui o seu julgamento clínico. Ele organiza o que você registrou.
          </Confianca>
          {SIGILO_CONFERIDO && (
            <Confianca icon={<Lock className="w-5 h-5" />} title="Sigilo.">
              Acesso só com o seu login, cada conta vê só os próprios dados, e os serviços de IA que usamos não usam
              seus registros para treinar modelos.
            </Confianca>
          )}
        </div>
      </Section>

      {/* 1.7 Perguntas frequentes */}
      <Section>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Perguntas frequentes</h2>
        <div className="max-w-3xl">
          <FaqItem q="Por que vocês pedem o cartão no teste?">
            Para o seu acesso continuar sem interrupção quando os 14 dias acabarem. Nada é cobrado durante o teste.
            A primeira cobrança, de R$ 99, acontece no 15º dia, e você recebe um aviso por e-mail 3 dias antes.
            Cancele antes, em &quot;Minha assinatura&quot;, e não paga nada.
          </FaqItem>
          <FaqItem q="O que acontece no fim dos 14 dias?">
            Se você não cancelou, o Mercado Pago cobra R$ 99 e você continua usando, sem perder nada. Depois, todo mês
            no mesmo dia. Se cancelou durante o teste, nada é cobrado e sua conta fica em modo leitura: você continua
            vendo tudo o que registrou, mas não faz registros novos nem usa a IA.
          </FaqItem>
          <FaqItem q="Como cancelo?">
            Em &quot;Minha assinatura&quot;, dentro do sistema, a qualquer momento. Cancelou no teste, não paga nada.
            {ACESSO_ATE_NO_BANCO && ' Cancelou depois, usa até o fim do mês já pago.'}
          </FaqItem>
          {RAQUEL_NA_CONTA && (
            <FaqItem q="Quem é a Raquel?">
              Uma paciente fictícia que já vem na sua conta, com sessões registradas e o caso lido pelo Clínica.ai.
              Serve para você ver o sistema funcionando antes do seu primeiro registro. Ela tem o selo &quot;Paciente
              fictícia&quot;, não conta no limite do teste e você pode apagá-la quando quiser.
            </FaqItem>
          )}
          <FaqItem q="Preciso gravar minhas sessões?">
            Não. O Clínica.ai trabalha com o que você já produz: anotações digitadas, coladas, fotografadas ou um memo
            de voz seu, feito depois do atendimento. Se um dia você decidir gravar uma sessão, a Resolução CFP 13/2022
            (art. 11) exige o consentimento livre, prévio, informado e por escrito do paciente.
          </FaqItem>
          <FaqItem q="A IA faz diagnóstico?">
            Não. Ela organiza o que você registrou: temas, linha do tempo e mudanças ao longo do caso. A leitura clínica é sua.
          </FaqItem>
          <FaqItem q="Posso trazer minhas anotações antigas?">
            Sim: por texto, arquivo .txt ou .pdf, ou foto de anotações à mão.
          </FaqItem>
          <FaqItem q="Atendo em clínica com outros psicólogos. Tem plano para equipe?">
            Ainda não. Por enquanto, cada psicólogo tem a própria conta, por R$ 99 por mês.
          </FaqItem>
          {SIGILO_CONFERIDO && (
            <FaqItem q="Meus dados ficam seguros?">
              Seus registros ficam protegidos por login, cada conta vê só os próprios dados, e os serviços de IA que
              usamos não usam seus registros para treinar modelos.
            </FaqItem>
          )}
          {CONTATO_RECEBE && (
            <FaqItem q="Preciso de ajuda. Onde encontro?">
              Dentro do sistema, a Ajuda tem vídeos curtos de cada parte. Se precisar, escreva para
              contato@clinicaai.net.br. Respondemos em dias úteis.
            </FaqItem>
          )}
        </div>
      </Section>

      {/* 1.8 Chamada final */}
      <div className="bg-primary-700 text-white py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {RAQUEL_NA_CONTA
              ? 'Abra o caso da Raquel hoje. Teste com os seus pacientes por 14 dias.'
              : 'Teste com os seus pacientes por 14 dias.'}
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed mb-8">
            {RAQUEL_NA_CONTA
              ? 'Sem reunião. Crie a conta, veja o caso da Raquel pronto e faça o seu primeiro registro. Cancele no teste e não paga nada.'
              : 'Sem reunião. Crie a conta e faça o seu primeiro registro. Cancele no teste e não paga nada.'}
          </p>
          <Link
            href="/cadastro"
            className="inline-block bg-white hover:bg-primary-50 text-primary-700 font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md"
          >
            Começar 14 dias grátis
          </Link>
        </div>
      </div>

      {/* 1.9 Rodapé */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5">
            <span className="text-white font-bold">Clínica<span className="text-primary-400">.ai</span></span>
            {CONTATO_RECEBE && (
              <a href="mailto:contato@clinicaai.net.br" className="hover:text-white transition-colors">contato@clinicaai.net.br</a>
            )}
            <a href="https://instagram.com/clinicaai.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Instagram (@clinicaai.app)
            </a>
            {TERMOS_NO_AR && (
              <>
                <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
                <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
              </>
            )}
          </div>
          <p className="text-slate-500 text-xs leading-relaxed max-w-3xl">
            O Clínica.ai é um sistema de apoio à organização de registros clínicos. Não faz diagnóstico nem substitui o
            julgamento profissional do psicólogo.
          </p>
        </div>
      </footer>
    </div>
  )
}
