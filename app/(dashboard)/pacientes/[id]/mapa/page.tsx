'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pacientesApi } from '@/lib/api'
import { ArrowLeft, Activity, Calendar, FileText, Brain, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Prontuario {
  id: string
  tipo: string
  data_atendimento: string
  queixa_principal?: string
  anamnese?: string
  exame_fisico?: string
  hipotese_diagnostica?: string
  conduta?: string
  prescricao?: string
  observacoes?: string
  resumo_ia?: string
}

interface MapaData {
  paciente: {
    id: string
    nome: string
    data_nascimento?: string
    cpf?: string
  }
  prontuarios: Prontuario[]
  total_consultas: number
  primeira_consulta?: string
  ultima_consulta?: string
}

function EntradaTimeline({ p, index }: { p: Prontuario; index: number }) {
  const [expandido, setExpandido] = useState(false)

  const tipoColor: Record<string, string> = {
    consulta: 'bg-blue-100 text-blue-800',
    retorno: 'bg-green-100 text-green-800',
    urgencia: 'bg-red-100 text-red-800',
    exame: 'bg-purple-100 text-purple-800',
    procedimento: 'bg-yellow-100 text-yellow-800',
  }
  const cor = tipoColor[p.tipo?.toLowerCase()] || 'bg-gray-100 text-gray-800'

  return (
    <div className="flex gap-4">
      {/* linha vertical */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white ring-2 ring-indigo-200 mt-1 flex-shrink-0" />
        {index >= 0 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
      </div>

      {/* card */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`}>
              {p.tipo}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(p.data_atendimento)}
            </span>
          </div>
          <button
            onClick={() => setExpandido(!expandido)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {p.queixa_principal && (
          <p className="mt-2 text-sm text-gray-700 font-medium">{p.queixa_principal}</p>
        )}

        {p.resumo_ia && (
          <div className="mt-2 flex items-start gap-1.5 bg-indigo-50 rounded-lg p-2.5">
            <Brain className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">{p.resumo_ia}</p>
          </div>
        )}

        {expandido && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {p.anamnese && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Anamnese</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.anamnese}</p>
              </div>
            )}
            {p.hipotese_diagnostica && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Hipótese Diagnóstica</p>
                <p className="text-sm text-gray-700">{p.hipotese_diagnostica}</p>
              </div>
            )}
            {p.conduta && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Conduta</p>
                <p className="text-sm text-gray-700">{p.conduta}</p>
              </div>
            )}
            {p.prescricao && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Prescrição</p>
                <p className="text-sm text-gray-700">{p.prescricao}</p>
              </div>
            )}
            {p.observacoes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Observações</p>
                <p className="text-sm text-gray-700">{p.observacoes}</p>
              </div>
            )}
            <Link
              href={`/pacientes/${p.id}`}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-1"
            >
              <FileText className="w-3 h-3" />
              Ver prontuário completo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MapaLongitudinalPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [mapa, setMapa] = useState<MapaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    pacientesApi.mapaLongitudinal(id)
      .then((data: any) => {
        // backend pode retornar formato variado — normalizamos aqui
        if (data && data.paciente) {
          setMapa(data as MapaData)
        } else if (Array.isArray(data)) {
          // fallback: array de prontuarios sem wrapper
          setMapa({
            paciente: { id, nome: 'Paciente' },
            prontuarios: data,
            total_consultas: data.length,
          })
        } else {
          setMapa(data)
        }
      })
      .catch((e: any) => setErro(e?.message || 'Erro ao carregar mapa longitudinal'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Carregando mapa longitudinal...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{erro}</div>
      </div>
    )
  }

  const prontuarios = mapa?.prontuarios ?? []

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar ao paciente</span>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-gray-900">Mapa Longitudinal</h1>
        </div>
        {mapa?.paciente?.nome && (
          <p className="text-gray-600 ml-7">{mapa.paciente.nome}</p>
        )}
      </div>

      {/* estatísticas */}
      {mapa && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{mapa.total_consultas ?? prontuarios.length}</p>
            <p className="text-xs text-indigo-600 mt-0.5">Consultas</p>
          </div>
          {mapa.primeira_consulta && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-gray-700">{formatDate(mapa.primeira_consulta)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Primeira consulta</p>
            </div>
          )}
          {mapa.ultima_consulta && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-gray-700">{formatDate(mapa.ultima_consulta)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Última consulta</p>
            </div>
          )}
        </div>
      )}

      {/* timeline */}
      {prontuarios.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nenhum registro clínico encontrado.</p>
        </div>
      ) : (
        <div>
          {prontuarios.map((p, i) => (
            <EntradaTimeline key={p.id} p={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
