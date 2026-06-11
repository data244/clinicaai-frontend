'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Mensagens por rota — Marina sabe onde está
// ---------------------------------------------------------------------------
type MensagemMarina = { titulo: string; texto: string }

function getMensagem(pathname: string): MensagemMarina | null {
  if (pathname === '/pacientes' || pathname === '/pacientes/') {
    return {
      titulo: 'Primeiro paciente',
      texto: 'Vamos começar! Clique em **+ Novo paciente** e preencha nome e data de nascimento — o resto pode vir depois.',
    }
  }
  if (pathname.startsWith('/pacientes/novo')) {
    return {
      titulo: 'Cadastro do paciente',
      texto: 'Preencha os dados básicos. Depois de salvar, vou te mostrar como importar o histórico dele.',
    }
  }
  // /pacientes/[id] mas não /mapa
  if (/^\/pacientes\/[^/]+$/.test(pathname)) {
    return {
      titulo: 'Importar histórico',
      texto: 'Clique em **Importar** — pode mandar texto, arquivo ou **foto do caderno**. Não se preocupe com formato ou organização: eu cuido disso.',
    }
  }
  if (pathname.includes('/mapa')) {
    return {
      titulo: 'O mapa do caso',
      texto: 'Tudo que você registrou, organizado. Veja a **Análise**, a **Linha do Tempo**, os padrões — e principalmente o **Mapa de Conceitos**!',
    }
  }
  if (pathname.startsWith('/copiloto')) {
    return {
      titulo: 'Copiloto Clínico',
      texto: 'Selecione o paciente e me faça qualquer pergunta — DSM-5, CID-11, hipóteses, estratégias. Posso ser seu supervisor aqui.',
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

function setDismissed(pathname: string) {
  try {
    const s = getDismissed()
    s.add(pathname)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)))
  } catch { /* */ }
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
interface Props {
  pathname: string
}

export default function MarinaHelper({ pathname }: Props) {
  const [visivel, setVisivel] = useState(false)
  const [aberta, setAberta] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemMarina | null>(null)

  useEffect(() => {
    const msg = getMensagem(pathname)
    if (!msg) { setVisivel(false); return }
    const dismissed = getDismissed()
    const key = normKey(pathname)
    if (dismissed.has(key)) {
      // Ainda mostra o ícone, mas balão fechado
      setMensagem(msg)
      setAberta(false)
      setVisivel(true)
    } else {
      // Primeira visita: abre o balão automaticamente após 800ms
      setMensagem(msg)
      setVisivel(true)
      const t = setTimeout(() => setAberta(true), 800)
      return () => clearTimeout(t)
    }
  }, [pathname])

  function dispensar() {
    setDismissed(normKey(pathname))
    setAberta(false)
  }

  if (!visivel || !mensagem) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Balão de fala */}
      {aberta && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-800 text-sm">{mensagem.titulo}</p>
            <button onClick={dispensar} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {renderTexto(mensagem.texto)}
          </p>
          <button
            onClick={dispensar}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Entendi ✓
          </button>
        </div>
      )}

      {/* Bolinha da Marina */}
      <button
        onClick={() => setAberta(a => !a)}
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
function normKey(pathname: string): string {
  // normaliza /pacientes/[id] → /pacientes/:id para agrupar todas as fichas
  return pathname.replace(/\/pacientes\/[^/]+$/, '/pacientes/:id')
                 .replace(/\/pacientes\/[^/]+\/mapa/, '/pacientes/:id/mapa')
}

function renderTexto(texto: string): React.ReactNode {
  // Converte **bold** em <strong>
  const parts = texto.split(/\*\*([^*]+)\*\*/g)
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="text-gray-800">{p}</strong> : p
  )
}
