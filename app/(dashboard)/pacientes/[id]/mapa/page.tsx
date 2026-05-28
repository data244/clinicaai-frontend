'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { iaApi } from '@/lib/api'
import {
  ArrowLeft, Activity, Calendar, FileText, Brain, ChevronDown, ChevronUp,
  Users, TrendingUp, AlertTriangle, MessageSquare, BarChart2, Send, Network, RefreshCw
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface Padrao { tema: string; frequencia: number; sessoes: number[]; evolucao: string; observacao: string }
interface Pessoa { nome_papel: string; frequencia: number; sessoes: number[]; contexto: string }
interface Emocao { emocao: string; frequencia: number; intensidade: string }
interface Indicador { indicador: string; tendencia: string }
interface Analise {
  padroes: Padrao[]; pessoas_citadas: Pessoa[]; emocoes_dominantes: Emocao[]
  resumo_clinico: string; indicadores_progresso: Indicador[]; alertas_clinicos: string[]
}
interface Prontuario {
  id: string; tipo: string; data_atendimento: string; queixa_principal?: string
  anamnese?: string; hipotese_diagnostica?: string; conduta?: string
  prescricao?: string; observacoes?: string; resumo_ia?: string
}

// ââ Sub-components âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const EvolucaoBadge = ({ e }: { e: string }) => {
  const map: Record<string, string> = {
    crescente: 'bg-red-100 text-red-700', decrescente: 'bg-green-100 text-green-700',
    estavel: 'bg-gray-100 text-gray-600', flutuante: 'bg-yellow-100 text-yellow-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[e] || 'bg-gray-100 text-gray-600'}`}>{e}</span>
}

const TendenciaBadge = ({ t }: { t: string }) => {
  const map: Record<string, { cls: string; icon: string }> = {
    positiva: { cls: 'text-green-600', icon: 'â' },
    negativa: { cls: 'text-red-500', icon: 'â' },
    neutra: { cls: 'text-gray-500', icon: 'â' },
  }
  const v = map[t] || map.neutra
  return <span className={`text-sm font-bold ${v.cls}`}>{v.icon}</span>
}

function TimelineCard({ p, index }: { p: Prontuario; index: number }) {
  const [open, setOpen] = useState(false)
  const preview = p.anamnese || p.observacoes || ''
  const previewShort = preview.split('\n').slice(0, 2).join(' ').slice(0, 120)
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white ring-2 ring-indigo-200 mt-1 flex-shrink-0" />
        {index >= 0 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{p.tipo}</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{formatDate(p.data_atendimento)}
            </span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {p.queixa_principal && <p className="mt-2 text-sm text-gray-700 font-medium">{p.queixa_principal}</p>}
        {!open && previewShort && (
          <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">{previewShort}</p>
        )}
        {p.resumo_ia && (
          <div className="mt-2 flex items-start gap-1.5 bg-indigo-50 rounded-lg p-2.5">
            <Brain className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">{p.resumo_ia}</p>
          </div>
        )}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
            {p.anamnese && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Anamnese</p><p className="whitespace-pre-wrap">{p.anamnese}</p></div>}
            {p.hipotese_diagnostica && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Hipotese</p><p>{p.hipotese_diagnostica}</p></div>}
            {p.conduta && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Conduta</p><p>{p.conduta}</p></div>}
            {p.prescricao && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Prescricao</p><p>{p.prescricao}</p></div>}
            {p.observacoes && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Observacoes</p><p>{p.observacoes}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ââ Concept Map (preset 2-ring layout â guaranteed no overlap) âââââââââââââââââ

interface MapNode { id: string; label: string; x: number; y: number; kind: 'patient'|'cat'|'item' }
interface MapEdge { src: string; dst: string; dashed?: boolean }

function itemPositions(catX: number, catY: number, count: number, cx: number, cy: number): {x:number;y:number}[] {
  const D1 = 108, D2 = 164
  const base = Math.atan2(catY - cy, catX - cx)
  const presets: [number,number][][] = [
    [],
    [[0, D1]],
    [[-0.55, D1],[0.55, D1]],
    [[-0.70, D1],[0, D1],[0.70, D1]],
    [[-0.55, D1],[0.55, D1],[-0.28, D2],[0.28, D2]],
    [[-0.70, D1],[0, D1],[0.70, D1],[-0.32, D2],[0.32, D2]],
  ]
  const cfg = presets[Math.min(count, 5)] || []
  return cfg.map(([off, d]) => ({ x: catX + Math.cos(base + off) * d, y: catY + Math.sin(base + off) * d }))
}

function buildConceptGraph(analise: Analise, name: string): {nodes: MapNode[]; edges: MapEdge[]} {
  const W = 800, H = 560, cx = W/2, cy = H/2, catDist = 215
  const nodes: MapNode[] = [{ id: 'patient', label: name, x: cx, y: cy, kind: 'patient' }]
  const edges: MapEdge[] = []
  const cats = [
    { id: 'c_pad', label: 'Padroes',     items: (analise.padroes||[]).slice(0,5).map(p=>p.tema),              angle: -Math.PI/2 },
    { id: 'c_pss', label: 'Pessoas',     items: (analise.pessoas_citadas||[]).slice(0,5).map(p=>p.nome_papel), angle:  Math.PI/2 },
    { id: 'c_emo', label: 'Emocoes',     items: (analise.emocoes_dominantes||[]).slice(0,5).map(e=>e.emocao),  angle:  Math.PI   },
    { id: 'c_ind', label: 'Indicadores', items: (analise.indicadores_progresso||[]).slice(0,5).map(i=>i.indicador), angle: 0    },
  ]
  for (const cat of cats) {
    if (!cat.items.length) continue
    const cx2 = cx + Math.cos(cat.angle) * catDist
    const cy2 = cy + Math.sin(cat.angle) * catDist
    nodes.push({ id: cat.id, label: cat.label, x: cx2, y: cy2, kind: 'cat' })
    edges.push({ src: 'patient', dst: cat.id })
    const pos = itemPositions(cx2, cy2, cat.items.length, cx, cy)
    cat.items.forEach((item, i) => {
      const id = cat.id + '_' + i
      nodes.push({ id, label: item, x: pos[i].x, y: pos[i].y, kind: 'item' })
      edges.push({ src: cat.id, dst: id, dashed: true })
    })
  }
  return { nodes, edges }
}

function clip(s: string, n: number) { return s.length > n ? s.slice(0, n) + 'â¦' : s }

function ConceptMap({ analise, pacienteName, onRegen, timestamp }: {
  analise: Analise; pacienteName: string; onRegen: () => void; timestamp?: string
}) {
  const W = 800, H = 560
  const { nodes, edges } = useMemo(() => buildConceptGraph(analise, pacienteName), [analise, pacienteName])
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">Mapa visual dos padroes identificados</p>
          {timestamp && <span className="text-xs text-gray-300">Â· Analisado as {timestamp}</span>}
        </div>
        <button onClick={onRegen}
          className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 transition-colors">
          <RefreshCw className="w-3 h-3" />
          Regenerar
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <svg width={W} height={H} className="bg-gray-50">
          <defs>
            <marker id="ah" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#a5b4fc" />
            </marker>
          </defs>
          {edges.map((e, i) => {
            const s = nodes.find(n => n.id === e.src)
            const d = nodes.find(n => n.id === e.dst)
            if (!s || !d) return null
            return <line key={i} x1={s.x} y1={s.y} x2={d.x} y2={d.y}
              stroke={e.dashed ? '#e0e7ff' : '#c7d2fe'}
              strokeWidth={e.dashed ? 1 : 1.5}
              strokeDasharray={e.dashed ? '4 3' : undefined}
              markerEnd={!e.dashed ? 'url(#ah)' : undefined}
              opacity={0.75}
            />
          })}
          {nodes.map(node => {
            if (node.kind === 'patient') return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <circle r={38} fill="#6366f1" />
                <circle r={38} fill="none" stroke="#818cf8" strokeWidth={2.5} opacity={0.5} />
                <text textAnchor="middle" dy={-7} fill="white" fontSize={11} fontWeight="bold" fontFamily="system-ui">
                  {clip(node.label.split(' ')[0], 12)}
                </text>
                <text textAnchor="middle" dy={8} fill="white" fontSize={9} opacity={0.8} fontFamily="system-ui">
                  {node.label.split(' ').slice(1,3).join(' ').slice(0,16)}
                </text>
              </g>
            )
            if (node.kind === 'cat') return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <rect x={-43} y={-17} width={86} height={34} rx={9} fill="#e0e7ff" stroke="#a5b4fc" strokeWidth={1.5} />
                <text textAnchor="middle" dy={5} fill="#4338ca" fontSize={11} fontWeight="600" fontFamily="system-ui">
                  {node.label}
                </text>
              </g>
            )
            const lbl = clip(node.label, 18)
            const bw = Math.max(64, Math.min(110, lbl.length * 6.2 + 18))
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                <rect x={-bw/2} y={-14} width={bw} height={28} rx={7} fill="white" stroke="#e2e8f0" strokeWidth={1} />
                <text textAnchor="middle" dy={4} fill="#374151" fontSize={10} fontFamily="system-ui">
                  {lbl}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ââ Main Page ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default function MapaLongitudinalPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'analise' | 'timeline' | 'conceitos' | 'perguntas'>('analise')
  const [timestamp, setTimestamp] = useState('')

  const [mapaMsg, setMapaMsg] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [mapaPergunta, setMapaPergunta] = useState('')
  const [mapaLoading, setMapaLoading] = useState(false)
  const mapaEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (id) load() }, [id])
  useEffect(() => { mapaEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mapaMsg])

  function nowHHMM() {
    const n = new Date()
    return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0')
  }

  async function load() {
    setLoading(true)
    try {
      const res = await iaApi.analiseLongitudinal(id as string)
      setData(res)
      setTimestamp(nowHHMM())
    } catch (e: any) {
      setErro(e?.message || 'Erro ao carregar analise')
    } finally {
      setLoading(false)
    }
  }

  async function regenerar() {
    setRegenerating(true)
    try {
      const res = await iaApi.analiseLongitudinal(id as string)
      setData(res)
      setTimestamp(nowHHMM())
    } catch {}
    finally { setRegenerating(false) }
  }

  const contextoAnalise = useMemo(() => {
    if (!data?.analise) return undefined
    const a: Analise = data.analise
    const parts: string[] = []
    if (a.resumo_clinico) parts.push('Resumo: ' + a.resumo_clinico)
    if (a.padroes?.length) parts.push('Padroes: ' + a.padroes.map(p=>`${p.tema} (${p.frequencia}x, ${p.evolucao})`).join('; '))
    if (a.pessoas_citadas?.length) parts.push('Pessoas: ' + a.pessoas_citadas.map(p=>`${p.nome_papel} (${p.frequencia}x)`).join('; '))
    if (a.emocoes_dominantes?.length) parts.push('Emocoes: ' + a.emocoes_dominantes.map(e=>`${e.emocao} (${e.frequencia}x)`).join('; '))
    if (a.indicadores_progresso?.length) parts.push('Indicadores: ' + a.indicadores_progresso.map(i=>`${i.indicador}: ${i.tendencia}`).join('; '))
    if (a.alertas_clinicos?.length) parts.push('Alertas: ' + a.alertas_clinicos.join('; '))
    return parts.join('\n')
  }, [data])

  async function perguntarMapa() {
    if (!mapaPergunta.trim() || mapaLoading) return
    const pergunta = mapaPergunta.trim()
    const newMessages = [...mapaMsg, { role: 'user' as const, content: pergunta }]
    setMapaMsg(newMessages)
    setMapaPergunta('')
    setMapaLoading(true)
    try {
      const historico = mapaMsg.map(m => ({ role: m.role, content: m.content }))
      const res = await (await import('@/lib/api')).iaApi.copiloto(pergunta, id as string, historico, contextoAnalise)
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: res.resposta }])
    } catch (e: any) {
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: 'Erro: ' + (e.message || 'tente novamente') }])
    } finally {
      setMapaLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Analisando historico clinico...</p>
        <p className="text-gray-400 text-xs mt-1">Isso pode levar alguns segundos</p>
      </div>
    </div>
  )

  if (erro) return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href={`/pacientes/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao paciente
      </Link>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{erro}</div>
    </div>
  )

  const analise: Analise | null = data?.analise
  const prontuarios: Prontuario[] = data?.prontuarios || []

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">Mapa Longitudinal</h1>
          </div>
          <div className="flex items-center gap-3 ml-7">
            {data?.paciente && <p className="text-sm text-gray-500">{data.paciente}</p>}
            {timestamp && <span className="text-xs text-gray-400">Â· Analisado as {timestamp}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{data?.total_sessoes ?? 0}</p>
          <p className="text-xs text-indigo-600 mt-0.5">Sessoes</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.padroes?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Padroes identificados</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.pessoas_citadas?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pessoas citadas</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {(['analise','timeline','conceitos','perguntas'] as const).map(key => (
          <button key={key} onClick={() => setAba(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${aba === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {key === 'analise'   && <><BarChart2 className="w-4 h-4" />Analise</>}
            {key === 'timeline'  && <><FileText className="w-4 h-4" />Linha do Tempo</>}
            {key === 'conceitos' && <><Network className="w-4 h-4" />Conceitos</>}
            {key === 'perguntas' && <><MessageSquare className="w-4 h-4" />Perguntas</>}
          </button>
        ))}
      </div>

      {aba === 'analise' && (
        <div className="space-y-5">
          {!analise ? (
            <div className="text-center py-12 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma analise disponivel. Adicione prontuarios primeiro.</p>
            </div>
          ) : (
            <>
              {analise.resumo_clinico && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-indigo-800">Resumo Clinico</h3>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{analise.resumo_clinico}</p>
                </div>
              )}
              {analise.padroes?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Padroes Recorrentes
                  </h3>
                  <div className="space-y-3">
                    {analise.padroes.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-700">{p.frequencia}x</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-medium text-gray-900">{p.tema}</p>
                            <EvolucaoBadge e={p.evolucao} />
                          </div>
                          {p.observacao && <p className="text-xs text-gray-500">{p.observacao}</p>}
                          {p.sessoes?.length > 0 && <p className="text-xs text-gray-400 mt-0.5">Sessoes: {p.sessoes.join(', ')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analise.pessoas_citadas?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" /> Pessoas Citadas
                  </h3>
                  <div className="space-y-2">
                    {analise.pessoas_citadas.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-700">{p.frequencia}x</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 capitalize">{p.nome_papel}</p>
                          <p className="text-xs text-gray-500">{p.contexto}</p>
                        </div>
                        {p.sessoes?.length > 0 && <span className="text-xs text-gray-400">Sess. {p.sessoes.join(', ')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analise.emocoes_dominantes?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Emocoes Dominantes</h3>
                    <div className="space-y-2">
                      {analise.emocoes_dominantes.map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, (e.frequencia / (data.total_sessoes || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-700 w-24 truncate">{e.emocao}</span>
                          <span className="text-xs text-gray-400 w-4">{e.frequencia}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analise.indicadores_progresso?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Indicadores</h3>
                    <div className="space-y-2">
                      {analise.indicadores_progresso.map((ind, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <TendenciaBadge t={ind.tendencia} />
                          <p className="text-xs text-gray-700">{ind.indicador}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {analise.alertas_clinicos?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Alertas Clinicos
                  </h3>
                  <ul className="space-y-1">
                    {analise.alertas_clinicos.map((a, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                        <span className="mt-1">&#x2022;</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {aba === 'timeline' && (
        <div>
          {prontuarios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum registro clinico encontrado.</p>
            </div>
          ) : prontuarios.map((p, i) => <TimelineCard key={p.id} p={p} index={i} />)}
        </div>
      )}

      {aba === 'conceitos' && (
        <div>
          {!analise ? (
            <div className="text-center py-12 text-gray-400">
              <Network className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma analise disponivel para gerar o mapa.</p>
            </div>
          ) : (
            <ConceptMap analise={analise} pacienteName={data?.paciente || 'Paciente'} onRegen={regenerar} timestamp={timestamp} />
          )}
          {regenerating && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-indigo-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Regenerando analise...
            </div>
          )}
        </div>
      )}

      {aba === 'perguntas' && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800">Perguntas ao Historico</p>
            <p className="text-xs text-gray-400 mt-0.5">Ex: Quantas vezes ele citou a esposa? Houve evolucao na queixa principal?</p>
          </div>
          {mapaMsg.length > 0 && (
            <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
              {mapaMsg.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <ReactMarkdown components={{
                        p: ({...props}) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />,
                        strong: ({...props}) => <strong className="font-semibold" {...props} />,
                        ul: ({...props}) => <ul className="text-sm list-disc ml-4 mb-2 space-y-0.5" {...props} />,
                        li: ({...props}) => <li className="text-sm" {...props} />,
                      }}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {mapaLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              )}
              <div ref={mapaEndRef} />
            </div>
          )}
          {mapaMsg.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Faca uma pergunta sobre o historico do paciente</p>
            </div>
          )}
          <div className="px-5 py-4 border-t border-gray-50 flex gap-2">
            <input type="text" value={mapaPergunta} onChange={e => setMapaPergunta(e.target.value)}
              onKeyDown={async e => { if (e.key === 'Enter' && !mapaLoading) await perguntarMapa() }}
              placeholder="Quantas vezes ele citou a esposa?" disabled={mapaLoading}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60" />
            <button onClick={perguntarMapa} disabled={mapaLoading || !mapaPergunta.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {mapaLoading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
