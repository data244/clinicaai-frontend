'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema do formulário
// ---------------------------------------------------------------------------

const schema = z.object({
  nome: z.string().min(2, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  whatsapp: z.string().min(10, 'Informe o WhatsApp com DDD'),
  crp: z.string().optional(),
  num_pacientes: z.enum(['ate_10', '11_20', '21_35', 'mais_35'], {
    required_error: 'Selecione uma opção',
  }),
  como_registra: z.enum(['caderno', 'word_docs', 'software', 'nao_registro'], {
    required_error: 'Selecione uma opção',
  }),
  como_conheceu: z.enum(['instagram', 'linkedin', 'indicacao', 'outro'], {
    required_error: 'Selecione uma opção',
  }),
})

type FormData = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-16 px-4 ${className}`}>
      <div className="max-w-3xl mx-auto">{children}</div>
    </section>
  )
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-primary-500 pl-5 py-2 my-6 bg-primary-50 rounded-r-lg">
      <p className="text-slate-700 font-medium leading-relaxed">{children}</p>
    </blockquote>
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

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex justify-between items-start gap-4 hover:text-primary-700 transition-colors"
      >
        <span className="font-medium text-slate-800">{q}</span>
        <span className="text-primary-600 text-xl flex-shrink-0 mt-0.5">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="pb-5 text-slate-600 leading-relaxed text-sm">{children}</div>
      )}
    </div>
  )
}

function CtaButton({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md ${className}`}
    >
      Quero participar do Beta Fundador — 100 vagas gratuitas
    </button>
  )
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

function FormularioInscricao() {
  const [enviado, setEnviado] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErroEnvio('')
    try {
      const res = await fetch('/api/beta-inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.ok) {
        setEnviado(true)
      } else {
        setErroEnvio(json.mensagem ?? 'Erro ao enviar. Tente novamente.')
      }
    } catch {
      setErroEnvio('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  if (enviado) {
    return (
      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-primary-700 mb-2">Inscrição recebida!</h3>
        <p className="text-slate-600">
          Entraremos em contato em até 24h para confirmar sua vaga e enviar o acesso.
          <br />Fique de olho no seu e-mail (incluindo a caixa de spam).
        </p>
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm placeholder-gray-400 bg-white'
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
  const errorCls = 'text-red-500 text-xs mt-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Nome completo *</label>
          <input {...register('nome')} placeholder="Dra. Maria Souza" className={inputCls} />
          {errors.nome && <p className={errorCls}>{errors.nome.message}</p>}
        </div>
        <div>
          <label className={labelCls}>E-mail *</label>
          <input {...register('email')} type="email" placeholder="você@email.com" className={inputCls} />
          {errors.email && <p className={errorCls}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelCls}>WhatsApp (com DDD) *</label>
          <input {...register('whatsapp')} placeholder="(11) 99999-9999" className={inputCls} />
          {errors.whatsapp && <p className={errorCls}>{errors.whatsapp.message}</p>}
        </div>
        <div>
          <label className={labelCls}>CRP <span className="text-gray-400 font-normal">(opcional — verificado no onboarding)</span></label>
          <input {...register('crp')} placeholder="06/123456" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Quantos pacientes você acompanha hoje? *</label>
        <select {...register('num_pacientes')} className={inputCls}>
          <option value="">Selecione...</option>
          <option value="ate_10">Até 10 pacientes</option>
          <option value="11_20">11 a 20 pacientes</option>
          <option value="21_35">21 a 35 pacientes</option>
          <option value="mais_35">Mais de 35 pacientes</option>
        </select>
        {errors.num_pacientes && <p className={errorCls}>{errors.num_pacientes.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Como você registra suas sessões hoje? *</label>
        <select {...register('como_registra')} className={inputCls}>
          <option value="">Selecione...</option>
          <option value="caderno">Caderno / papel</option>
          <option value="word_docs">Word, Docs ou similar</option>
          <option value="software">Software / prontuário eletrônico</option>
          <option value="nao_registro">Não registro com regularidade</option>
        </select>
        {errors.como_registra && <p className={errorCls}>{errors.como_registra.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Como conheceu o Clínica.ai? *</label>
        <select {...register('como_conheceu')} className={inputCls}>
          <option value="">Selecione...</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="indicacao">Indicação de colega</option>
          <option value="outro">Outro</option>
        </select>
        {errors.como_conheceu && <p className={errorCls}>{errors.como_conheceu.message}</p>}
      </div>

      {erroEnvio && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {erroEnvio}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md"
      >
        {isSubmitting ? 'Enviando...' : 'Quero minha vaga no Beta Fundador'}
      </button>
      <p className="text-center text-slate-400 text-xs">Sem cartão. Sem compromisso. Resposta em até 24h.</p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function LandingPage() {
  function scrollToForm() {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white text-slate-800">

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-tight">Clínica<span className="text-primary-400">.ai</span></span>
          <button
            onClick={scrollToForm}
            className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Quero minha vaga
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="bg-slate-900 text-white pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Beta Fundador · 100 vagas gratuitas</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
            Você sabe por que os pacientes abandonam a terapia?
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            A pesquisa surpreende: quase metade vai embora — e o motivo principal não é o diagnóstico.
            É não perceber a própria evolução. O Clínica.ai transforma seus registros de sessão em
            memória clínica viva, para que você enxergue — e mostre — o caminho que cada paciente está fazendo.
          </p>
          <CtaButton onClick={scrollToForm} />
          <p className="text-slate-400 text-sm mt-4">30 dias grátis · sem cartão de crédito · acesso completo</p>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="bg-primary-600 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">38–49%</p>
            <p className="text-primary-100 text-xs mt-1">taxa de abandono em estudos brasileiros</p>
          </div>
          <div>
            <p className="text-2xl font-bold">−20%</p>
            <p className="text-primary-100 text-xs mt-1">de abandono com monitoramento de progresso</p>
          </div>
          <div>
            <p className="text-2xl font-bold">58</p>
            <p className="text-primary-100 text-xs mt-1">estudos na meta-análise de referência</p>
          </div>
        </div>
      </div>

      {/* ── DOR ── */}
      <Section>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Sexta-feira, 19h, oitavo atendimento do dia.</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Amanhã você não vai lembrar metade do que ouviu hoje. E tudo bem — nenhuma memória humana sustenta
          20 trajetórias em paralelo. O problema é que suas anotações também não ajudam: ficam guardadas,
          caso a caso, sessão a sessão, e nunca mais são lidas.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">Enquanto isso, os números da profissão são duros:</p>
        <Quote>
          Estudos brasileiros apontam que entre 38% e 49% dos pacientes abandonam o tratamento. E a meta-análise
          internacional de referência (Swift & Greenberg, 2012) mostra que o abandono está mais ligado a fatores
          como expectativa e percepção de progresso do que ao diagnóstico.
        </Quote>
        <p className="text-slate-600 leading-relaxed">
          Paciente que não enxerga o próprio caminhar vai embora — mesmo quando está caminhando.
        </p>
      </Section>

      {/* ── LENTE ── */}
      <Section className="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Cada sessão que você registra é uma foto. O caso do seu paciente é um filme.
        </h2>
        <p className="text-slate-600 leading-relaxed mb-6">
          Você já produz o material mais valioso da sua prática: o registro de cada sessão. O que nunca existiu
          foi um jeito de assistir ao filme — ver os temas que se repetem, a linha do tempo do caso, o que mudou
          desde o terceiro mês, o que merece atenção agora.
        </p>
        <p className="text-slate-600 leading-relaxed mb-6">
          O Clínica.ai é essa lente. Não é um prontuário com IA. É uma camada de inteligência sobre o que você
          já escreve: memória clínica estruturada, padrões recorrentes, mapa de evolução e um copiloto que conhece
          o histórico inteiro do caso — para você decidir melhor, com o seu olhar clínico no centro.
        </p>
        <Quote>
          Acompanhar o progresso sistematicamente reduz o abandono em cerca de 20% e acelera a melhora
          (De Jong et al., 2021 — meta-análise de 58 estudos).
        </Quote>
      </Section>

      {/* ── COMO FUNCIONA ── */}
      <Section>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Como funciona</h2>
        <div className="space-y-8">
          <Step n={1} title="Registre do seu jeito.">
            Digite, cole suas anotações, fotografe o caderno — ou simplesmente <strong>fale por 3 minutos</strong> depois
            da sessão, na pausa entre atendimentos. Sem gravar sessão, sem mudar seu método: o registro é seu, sobre a sessão.
          </Step>
          <Step n={2} title="A memória do caso se constrói sozinha.">
            Cada registro alimenta a linha do tempo, os padrões e o mapa de evolução do paciente. O histórico antigo entra
            também: importe anotações de anos de acompanhamento em minutos.
          </Step>
          <Step n={3} title="Prepare cada sessão com o caso inteiro na mão.">
            Antes do paciente entrar, você revê em 2 minutos onde o caso está, o que se repete e o que evoluiu — e
            consegue mostrar esse caminho a quem mais precisa vê-lo: o próprio paciente.
          </Step>
        </div>
      </Section>

      {/* ── O QUE RECEBE ── */}
      <Section className="bg-primary-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">O que você recebe no Beta — tudo incluído</h2>
        <p className="text-slate-500 text-sm mb-8">Acesso completo desde o primeiro dia. Sem versão capada.</p>
        <div className="space-y-6">
          <Feature icon="📊" title="Análise longitudinal">
            Padrões, temas centrais, linha do tempo e mapa de evolução de cada caso — sem você precisar procurar.
          </Feature>
          <Feature icon="🤖" title="Copiloto clínico">
            Pergunte sobre o histórico do caso e prepare sessões com apoio do contexto completo. Seu olhar clínico continua no centro.
          </Feature>
          <Feature icon="🎙️" title="Memo de voz pós-sessão">
            Fale 3 minutos e o registro está feito, transcrito e organizado. Sem gravar a sessão, sem voz do paciente.
          </Feature>
          <Feature icon="📁" title="Importação de histórico">
            Texto, arquivo ou foto das anotações antigas. Anos de acompanhamento entram na plataforma em minutos.
          </Feature>
          <Feature icon="📅" title="Agenda e mapa de pacientes">
            Visão completa da sua carteira, com alertas e organização do fluxo de atendimentos.
          </Feature>
          <Feature icon="💳" title="Gestão financeira completa">
            Cobranças, link de pagamento via Mercado Pago e lembretes automáticos ao paciente.{' '}
            <strong>Você recebe dos seus pacientes desde o primeiro dia do teste.</strong>
          </Feature>
        </div>

        <div className="mt-10 bg-white border-2 border-primary-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-3">Beta Fundador</h3>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li>✓ <strong>100 vagas por ciclo</strong> — limite intencional para acompanhamento próximo</li>
            <li>✓ <strong>30 dias gratuitos</strong>, sem cartão de crédito</li>
            <li>✓ <strong>Acesso por convite</strong> — confirmamos em até 24h</li>
            <li>✓ <strong>Fila de espera</strong> para quem não entrar neste ciclo</li>
            <li>✓ <strong>Chance real de moldar o produto</strong> com seu feedback</li>
          </ul>
        </div>
      </Section>

      {/* ── CONFIANÇA ── */}
      <Section>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Feito para a realidade — e para as regras — da prática clínica.</h2>
        <div className="space-y-7">
          <Feature icon="📂" title="Seus registros, guardados como devem ser.">
            O CFP exige registro documental da evolução de cada trabalho, com guarda mínima de 5 anos (Resolução CFP nº 001/2009).
            No Clínica.ai, seus registros ficam armazenados com padrão arquivístico e sigilo — pelo prazo que a profissão exige,
            sem depender de caderno, gaveta ou arquivo solto.
          </Feature>
          <Feature icon="🔇" title="Nada de gravar sessões.">
            O áudio do Clínica.ai é o seu memo, sobre a sessão, gravado por você. A voz do paciente não entra na plataforma.
          </Feature>
          <Feature icon="🧠" title="Psicólogo no centro. IA como apoio.">
            A plataforma não diagnostica, não interpreta por você e não substitui o olhar clínico. Ela organiza a informação
            para que o SEU raciocínio trabalhe melhor.
          </Feature>
          <Feature icon="🔒" title="Sigilo e segurança.">
            Dados criptografados, acesso restrito a você, e seus dados nunca são usados para treinar modelos.
          </Feature>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Perguntas frequentes</h2>
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
          <div className="px-6">
            <FaqItem q="Preciso gravar minhas sessões?">
              Não — e não recomendamos. O Clínica.ai trabalha com o que você já produz: anotações digitadas, coladas,
              fotografadas ou um memo de voz seu, feito após a sessão. Se algum dia você optar por gravar uma sessão
              (prática permitida pelo CFP mediante consentimento livre, prévio, informado e por escrito — Resolução CFP 13/2022),
              a plataforma fornece o modelo de termo de consentimento.
            </FaqItem>
            <FaqItem q="A IA vai interpretar meus casos?">
              Não. Ela organiza, estrutura e devolve o que você registrou — linha do tempo, padrões, evolução. A leitura
              clínica é sua, sempre.
            </FaqItem>
            <FaqItem q="Quanto custa depois do beta?">
              R$ 99/mês para a inteligência clínica ou R$ 129/mês com a gestão financeira completa (cobranças, link de
              pagamento e lembretes). Quem participa do Beta Fundador recebe a oferta de assinatura ao final, sem compromisso.
            </FaqItem>
            <FaqItem q="Meus dados ficam seguros?">
              Sim: criptografia, sigilo profissional como princípio de projeto e guarda com padrão arquivístico pelo prazo
              mínimo que o CFP exige. Você exporta seus registros quando quiser.
            </FaqItem>
            <FaqItem q="Atendo em clínica com outros psicólogos. Tem plano para nós?">
              Tem: R$ 79/mês por psicólogo a partir de 3 profissionais do mesmo CNPJ. Escreva para contato@clinicaai.net.br.
            </FaqItem>
          </div>
        </div>
      </Section>

      {/* ── CTA + FORMULÁRIO ── */}
      <Section id="formulario">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
          As 100 vagas do Beta Fundador estão abertas.
        </h2>
        <p className="text-slate-500 text-center mb-10 leading-relaxed">
          Psicólogos clínicos, selecionados por convite, com acesso completo e gratuito por 30 dias —
          para testar, usar de verdade e moldar a plataforma conosco.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <FormularioInscricao />
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <span className="text-white font-bold text-base">Clínica<span className="text-primary-400">.ai</span></span>
            <div className="flex gap-4">
              <a href="https://instagram.com/clinicaai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://linkedin.com/company/clinicaai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="https://youtube.com/@clinicaai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
          <p className="mb-2">
            contato@clinicaai.net.br · Inteligência clínica longitudinal
          </p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Clínica.ai é uma plataforma de apoio à organização de registros clínicos. Não realiza diagnóstico nem
            substitui o julgamento profissional do psicólogo.
          </p>
        </div>
      </footer>

      {/* ── CTA FIXO MOBILE ── */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 p-3 shadow-lg z-40">
        <button
          onClick={scrollToForm}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Quero minha vaga
        </button>
      </div>

    </div>
  )
}
