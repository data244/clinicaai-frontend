'use client'

import { useState, useEffect } from 'react'
import { releasesApi, Release } from '@/lib/api'
import { Megaphone, Loader2, Globe, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'

export default function NovidadesPage() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    releasesApi.listar()
      .then(r => setReleases(r.releases))
      .catch(() => {/* mostra vazio */})
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => setExpandido(prev => prev === id ? null : id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novidades</h1>
          <p className="text-sm text-gray-500">Acompanhe o que foi lançado e melhorado no Clínica.ai</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : releases.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Nenhuma versão publicada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {releases.map((r, idx) => {
              const aberto = expandido === r.id
              const isLatest = idx === 0
              return (
                <div
                  key={r.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    isLatest ? 'border-indigo-200 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => toggle(r.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                          isLatest
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          v{r.versao}
                        </span>
                        {isLatest && (
                          <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            Mais recente
                          </span>
                        )}
                        {!r.publico && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <EyeOff className="w-3 h-3" /> Privado
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{r.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    {aberto ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Notas expandidas */}
                  {aberto && (
                    <div className="px-5 pb-5 border-t border-gray-50">
                      <div className="pt-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {r.notas}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
