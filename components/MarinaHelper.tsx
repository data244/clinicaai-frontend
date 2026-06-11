'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Mensagens por rota — tom: "você está aqui, veja isso" (não "vá fazer X")
// ---------------------------------------------------------------------------
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
  // /pacientes/[id]/mapa — testar ANTES de /pacientes/[id]
  if (/\/pacientes\/[^/]+\/mapa/.test(pathname)) {
    return {
      titulo: 'Mapa longitudinal',
      texto: 'Tudo que você registrou, organizado automaticamente. Explore a **Análise**, a **Linha do Tempo** e o **Mapa de Conceitos**.',
    }
  }
  // /pacientes/[id] (sem /mapa)
  if (/^\/pacientes\/[^/]+$/.test(pathname)) {
    return {
      titulo: 'Prontuário do paciente',
      texto: 'Aqui ficam todas as sessões. Use o botão **Importar** para trazer anotações antigas — texto, arquivo ou foto do caderno.',
    }
  }
  if (pathname.startsWith('/copiloto')) {
    return {
      titulo: 'Copiloto Clínico',
      texto: 'Selecione um paciente acima e me faça qualquer pergunta — hipóteses, DSM-5, estratégias terapêuticas. Sou seu **supervisor clínico** aqui.\n\n✓ Você completou a jornada básica! Se precisar de mim, é só clicar.',
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
  return pathname
    .replace(/\/pacientes\/[^/]+\/mapa/, '/pacientes/:id/mapa')
    .replace(/\/pacientes\/[^/]+$/, '/pacientes/:id')
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
interface Props {
  pathname: string
}

export default function MarinaHelper({ pathname }: Props) {
  const [aberta, setAberta] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemMarina | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const msg = getMensagem(pathname)
    if (!msg) {
      setMensagem(null)
      setAberta(false)
      return
    }

    setMensagem(msg)

    const dismissed = getDismissed()
    const key = normKey(pathname)

    if (!dismissed.has(key)) {
      // Primeira visita nesta rota: abre automaticamente
      timerRef.current = setTimeout(() => setAberta(true), 400)
    }
    // Se já foi dispensada: mantém fechado, mas clique na bolinha sempre reabre

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname])

  function dispensar() {
    markDismissed(normKey(pathname))
    setAberta(false)
  }

  function toggleBalloon() {
    if (!aberta) {
      // Atualiza a mensagem ao reabrir (garante conteúdo fresco)
      const msg = getMensagem(pathname)
      if (msg) setMensagem(msg)
    }
    setAberta(a => !a)
  }

  if (!mensagem) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Balão de fala */}
      {aberta && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-800 text-sm">{mensagem.titulo}</p>
            <button
              onClick={dispensar}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Fechar"
            >
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

      {/* Bolinha da Marina — sempre visível, sempre clicável */}
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderTexto(texto: string): React.ReactNode {
  // Converte \n\n em parágrafos e **bold** em <strong>
  return texto.split('\n\n').map((paragrafo, pi) => (
    <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
      {paragrafo.split(/\*\*([^*]+)\*\*/g).map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="text-gray-800">{p}</strong>
          : p
      )}
    </p>
  ))
}
