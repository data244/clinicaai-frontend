'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type MensagemMarina = { titulo: string; texto: string }

function getMensagem(pathname: string): MensagemMarina | null {
  if (pathname === '/pacientes' || pathname === '/pacientes/') {
    return {
      titulo: 'Lista de pacientes',
      texto: 'Aqui ficam todos os seus pacientes. Clique em **+ Novo paciente** para cadastrar o primeiro.',
    }
  }
  if (pathname.startsWith('/pacientes/novo')) {
    return {
      titulo: 'Cadastro do paciente',
      texto: 'Preencha nome e data de nascimento — o resto pode vir depois. Depois de salvar, vamos importar o histórico clínico.',
    }
  }
  // /mapa deve ser testado ANTES de /pacientes/[id]
  if (/\/pacientes\/[^/]+\/mapa/.test(pathname)) {
    return {
      titulo: 'Mapa longitudinal',
      texto: 'Aqui está o caso organizado. Explore a **Análise** e o **Mapa de Conceitos** — depois vá ao **Copiloto IA** para fazer perguntas clínicas sobre este paciente.',
    }
  }
  if (/^\/pacientes\/[^/]+$/.test(pathname)) {
    return {
      titulo: 'Prontuário do paciente',
      texto: 'Aqui ficam todos os registros do caso. Clique em **Mapa Longitudinal** para ver padrões, evolução e o mapa de conceitos — é lá que a análise acontece.',
    }
  }
  if (pathname.startsWith('/copiloto')) {
    return {
      titulo: 'Copiloto Clínico',
      texto: 'Selecione um paciente e me faça qualquer pergunta — hipóteses, DSM-5, estratégias. Sou seu **supervisor clínico** aqui.\n\n✓ Jornada básica completa! Se precisar de mim, é só clicar.',
    }
  }
  return null
}

const STORAGE_KEY = 'marina_tour_dismissed'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function markDismissed(key: string) {
  try {
    const s = getDismissed()
    s.add(key)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)))
  } catch { /* */ }
}

function normKey(pathname: string): string {
  // mapa antes de id para não confundir /pacientes/:id/mapa com /pacientes/:id
  return pathname
    .replace(/\/pacientes\/[^/]+\/mapa$/, '/pacientes/:id/mapa')
    .replace(/\/pacientes\/[^/]+$/, '/pacientes/:id')
}

interface Props { pathname: string }

export default function MarinaHelper({ pathname }: Props) {
  const [visivel, setVisivel] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemMarina | null>(null)

  useEffect(() => {
    const msg = getMensagem(pathname)
    if (!msg) { setVisivel(false); setAberta(false); return }

    const dismissed = getDismissed()
    const key = normKey(pathname)

    setMensagem(msg)
    setVisivel(true)

    if (dismissed.has(key)) {
      // Página já visitada: mostra ícone mas NÃO força fechar
      // (se o usuário tiver aberto manualmente, mantém aberto)
    } else {
      // Primeira visita: abre automaticamente
      const t = setTimeout(() => setAberta(true), 500)
      return () => clearTimeout(t)
    }
  }, [pathname])

  function dispensar() {
    markDismissed(normKey(pathname))
    setAberta(false)
  }

  function toggleBalloon() {
    if (!aberta) {
      const msg = getMensagem(pathname)
      if (msg) setMensagem(msg)
    }
    setAberta(a => !a)
  }

  if (!visivel || !mensagem) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {aberta && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-800 text-sm">{mensagem.titulo}</p>
            <button onClick={dispensar} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-gray-600 text-sm leading-relaxed">
            {renderTexto(mensagem.texto)}
          </div>
          <button
            onClick={dispensar}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Entendi ✓
          </button>
        </div>
      )}

      <button
        onClick={toggleBalloon}
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-500 shadow-lg hover:scale-105 transition-transform focus:outline-none"
        title="Marina — assistente do Clínica.ai"
      >
        <img src="/marina.png" alt="Marina" className="w-full h-full object-cover object-top" />
      </button>
    </div>
  )
}

function renderTexto(texto: string): React.ReactNode {
  return texto.split('\n\n').map((paragrafo, pi) => (
    <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
      {paragrafo.split(/\*\*([^*]+)\*\*/g).map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="text-gray-800">{p}</strong> : p
      )}
    </p>
  ))
}
