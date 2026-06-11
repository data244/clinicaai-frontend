'use client'

import { useState } from 'react'
import { X, ChevronRight, PlayCircle } from 'lucide-react'

interface Props {
  nomeUsuario?: string
  onClose: (pulou: boolean, respostas?: Respostas) => void
}

interface Respostas {
  num_pacientes?: string
  como_registra?: string
  quer_guia?: boolean
}

const PACIENTES_OPTS = [
  { value: 'ate_10',  label: 'Até 10 pacientes' },
  { value: '11_20',   label: '11 a 20 pacientes' },
  { value: 'mais_20', label: 'Mais de 20 pacientes' },
]

const REGISTRO_OPTS = [
  { value: 'caderno',       label: 'Caderno ou papel' },
  { value: 'word_docs',     label: 'Word, Docs ou similar' },
  { value: 'software',      label: 'Software / prontuário eletrônico' },
  { value: 'nao_registro',  label: 'Não tenho regularidade' },
]

const VIDEOS = [
  { titulo: 'Memo de voz — registre em 3 minutos',       disponivel: true },
  { titulo: 'Análise longitudinal e mapa do caso',        disponivel: true },
  { titulo: 'Copiloto IA — pergunte sobre o paciente',    disponivel: true },
  { titulo: 'Módulo financeiro — cobranças e pagamentos', disponivel: false },
  { titulo: 'Agenda e lembretes automáticos',             disponivel: false },
]

export default function OnboardingWizard({ nomeUsuario, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [respostas, setRespostas] = useState<Respostas>({})
  const primeiroNome = (nomeUsuario || '').split(' ')[0] || ''

  function escolher(campo: keyof Respostas, valor: string | boolean) {
    setRespostas(r => ({ ...r, [campo]: valor }))
    setStep(s => s + 1)
  }

  // Tela 0 — Boas-vindas
  if (step === 0) return (
    <Overlay onSkip={() => onClose(true)}>
      <MarinaCard>
        <p className="text-sm text-gray-500 mb-1">Sua assistente</p>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {primeiroNome ? `Oi, ${primeiroNome}! Eu sou a Marina.` : 'Oi! Eu sou a Marina.'}
        </h2>
        <p className="text-gray-600 leading-relaxed mb-2">
          Antes de qualquer coisa, o mais importante:{' '}
          <strong className="text-gray-900">nada nesta plataforma grava suas sessões.</strong>{' '}
          O registro é seu, feito por você, depois do atendimento. Pode relaxar.
        </p>
        <p className="text-gray-600 leading-relaxed mb-6">
          Me dá 1 minuto para entender sua prática? Assim te mostro só o que importa para você.
        </p>
        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Me conta mais <ChevronRight className="w-4 h-4" />
        </button>
      </MarinaCard>
    </Overlay>
  )

  // Tela 1 — Quantos pacientes?
  if (step === 1) return (
    <Overlay onSkip={() => onClose(true)}>
      <MarinaCard showMarina={false}>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">1 de 3</p>
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          Quantos pacientes você acompanha hoje?
        </h2>
        <div className="flex flex-col gap-3">
          {PACIENTES_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => escolher('num_pacientes', o.value)}
              className="text-left border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl px-4 py-3 text-gray-700 font-medium transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      </MarinaCard>
    </Overlay>
  )

  // Tela 2 — Como registra?
  if (step === 2) return (
    <Overlay onSkip={() => onClose(true)}>
      <MarinaCard showMarina={false}>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">2 de 3</p>
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          Como você registra suas sessões hoje?
        </h2>
        <div className="flex flex-col gap-3">
          {REGISTRO_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => escolher('como_registra', o.value)}
              className="text-left border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl px-4 py-3 text-gray-700 font-medium transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      </MarinaCard>
    </Overlay>
  )

  // Tela 3 — Quer guia?
  if (step === 3) return (
    <Overlay onSkip={() => onClose(true)}>
      <MarinaCard showMarina={false}>
        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide mb-2">3 de 3</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Pensa num paciente que você acompanha há bastante tempo.
        </h2>
        <p className="text-gray-600 mb-6">
          É com ele que quero te mostrar o que o Clínica.ai faz. Pode ser?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => escolher('quer_guia', true)}
            className="border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-3 text-indigo-700 font-semibold transition-colors"
          >
            Vamos lá
          </button>
          <button
            onClick={() => escolher('quer_guia', false)}
            className="border-2 border-gray-200 hover:border-gray-400 rounded-xl px-4 py-3 text-gray-600 font-medium transition-colors"
          >
            Prefiro explorar sozinho
          </button>
        </div>
      </MarinaCard>
    </Overlay>
  )

  // Tela 4a — CTA: importar histórico
  if (step === 4 && respostas.quer_guia === true) return (
    <Overlay onSkip={null}>
      <MarinaCard>
        <p className="text-gray-600 leading-relaxed mb-6">
          Traz as anotações desse paciente — pode digitar, colar, ou{' '}
          <strong className="text-gray-900">mandar foto do caderno</strong>. Em poucos minutos você vê
          o caso virar linha do tempo, temas e evolução.
        </p>
        <button
          onClick={() => onClose(false, respostas)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Importar histórico de um paciente
        </button>
      </MarinaCard>
    </Overlay>
  )

  // Tela 4b — Hub de vídeos
  return (
    <Overlay onSkip={null}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Central de tutoriais</h2>
        <p className="text-sm text-gray-500 mb-5">Quando quiser, é por aqui que você começa.</p>
        <div className="flex flex-col gap-3 mb-6">
          {VIDEOS.map((v, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                v.disponivel
                  ? 'border-indigo-200 bg-indigo-50 cursor-pointer hover:border-indigo-400'
                  : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <PlayCircle className={`w-5 h-5 flex-shrink-0 ${v.disponivel ? 'text-indigo-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${v.disponivel ? 'text-indigo-700' : 'text-gray-400'}`}>
                {v.titulo}
                {!v.disponivel && <span className="ml-2 text-xs text-gray-400">(em breve)</span>}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onClose(false, respostas)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Entrar no Clínica.ai
        </button>
      </div>
    </Overlay>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function Overlay({ children, onSkip }: { children: React.ReactNode; onSkip: (() => void) | null }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {onSkip && (
          <button
            onClick={onSkip}
            className="absolute -top-10 right-0 flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
          >
            <X className="w-4 h-4" /> depois
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

function MarinaCard({ children, showMarina = true }: { children: React.ReactNode; showMarina?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {showMarina && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 pt-6 pb-0 flex items-end gap-4">
          <img
            src="/marina.png"
            alt="Marina — assistente do Clínica.ai"
            className="w-24 h-24 object-cover object-top rounded-t-xl flex-shrink-0"
          />
          <p className="text-indigo-100 text-xs pb-3 leading-relaxed">
            Personagem do Clínica.ai
          </p>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
