'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  nomeUsuario?: string
  onClose: () => void
}

export default function OnboardingWizard({ nomeUsuario, onClose }: Props) {
  const [step, setStep] = useState(0)
  const primeiroNome = (nomeUsuario || '').split(' ')[0] || ''

  // Tela 0 — Boas-vindas
  if (step === 0) return (
    <Overlay>
      <button
        onClick={onClose}
        className="absolute -top-9 right-0 flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
      >
        <X className="w-4 h-4" /> pular tour
      </button>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 pt-5 pb-0 flex items-end gap-4">
          <img
            src="/marina.png"
            alt="Marina"
            className="w-24 h-24 object-cover object-top rounded-t-xl flex-shrink-0"
          />
          <p className="text-indigo-100 text-xs pb-3 leading-relaxed">Personagem do Clínica.ai</p>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {primeiroNome ? `Oi, ${primeiroNome}! Eu sou a Marina.` : 'Oi! Eu sou a Marina.'}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-2">
            Uma coisa importante antes de começar:{' '}
            <strong className="text-gray-900">nada aqui grava suas sessões.</strong>{' '}
            O registro é seu — feito por você, depois do atendimento, do jeito que preferir.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Quero te mostrar o caminho completo — do primeiro registro até o mapa do caso. Leva uns 5 minutos e você vai entender tudo.
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Me mostra o caminho →
          </button>
        </div>
      </div>
    </Overlay>
  )

  // Tela 1 — Resumo da jornada
  return (
    <Overlay>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">A jornada em 4 passos</h2>
        <ol className="space-y-4 mb-6">
          {[
            { n: '1', titulo: 'Crie um paciente', desc: 'Nome e data de nascimento já bastam para começar.' },
            { n: '2', titulo: 'Importe o histórico', desc: 'Texto, arquivo ou foto do caderno — eu organizo tudo.' },
            { n: '3', titulo: 'Veja o mapa do caso', desc: 'Padrões, linha do tempo, evolução e conceitos conectados.' },
            { n: '4', titulo: 'Converse com o Copiloto', desc: 'Pergunte qualquer coisa sobre o paciente — como um supervisor.' },
          ].map(s => (
            <li key={s.n} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.n}
              </span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{s.titulo}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-400 mb-4 text-center">
          Estarei do seu lado em cada tela — pode dispensar quando quiser.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Vamos começar
        </button>
      </div>
    </Overlay>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  )
}
