'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { iaApi } from '@/lib/api'
import {
  ArrowLeft, Activity, Calendar, FileText, Brain, ChevronDown, ChevronUp,
  Users, TrendingUp, AlertTriangle, MessageSquare, BarChart2, Sendh, Network
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Types ────────────────────────────────────────────────────────────────────────────────

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

// ── Badges ────────────────────────────────────────────────────────────────────────────────

const EvolucaoBadge = ({ e }: { e: string }) => {
  const map: Record<string, string> = {
    crescente: 'bg-red-100 text-red-700', decrescente: 'bg-green-100 text-green-700',
    estável: 'bg-gray-100 text-gray-600', flutuante: 'bg-yellow-100 text-yellow-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[e] || 'bg-gray-100 text-gray-600'}`}>{e}</span>
}

const TendenciaBadge = ({ t }: { t: string }) => {
  const map: Record<string, { cls: string; icon: string }> = {
    positiva: { cls: 'text-green-600', icon: '↑' },
    negativa: { cls: 'text-red-500', icon: '↓' },
    neutra: { cls: 'text-gray-500', icon: '→' },
  }
  const v = map[t] || map.neutra
  return <span className={`text-sm font-bold ${v.cls}`}>{v.icon}</span>
}

// ── TimelineCard ────────────────────────────────────────────────────────────────────────────

function TimelineCard({ p, index }: { p: Prontuario; index: number }) {
  const [open, setOpen] = useState(false)
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
        {p.resumo_ia && (
          <div className="mt-2 flex items-start gap-1.5 bg-indigo-50 rounded-lg p-2.5">
            <Brain className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">{p.resumo_ia}</p>
          </div>
        )}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
            {p.anamnese && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Anamnese</p><p className="whitespace-pre-wrap">{p.anamnese}</p></div>}
            {p.hipotese_diagnostica && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Hipótese</p><p>{p.hipotese_diagnostica}</p></div>}
            {p.conduta && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Conduta</p><p>{p.conduta}</p></div>}
            {p.prescricao && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Prescrição</p><p>{p.prescricao}</p></div>}
            {p.observacoes && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Observações</p><p>{p.observacoes}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Concept Map ────────────────────────────────────────────────────────────────────────────────

const NODE_COLORS = {
  patient:   { bg: '#6366f1', light: '#e0e7ff', text: '#4338ca', border: '#818cf8' },
  padrao:    { bg: '#f97316', light: '#fff7ed', text: '#c2410c', border: '#fb923c' },
  pessoa:    { bg: '#a855f7', light: '#faf5ff', text: '#7e22ce', border: '#c084fc' },
  emocao:    { bg: '#3b82f6', light: '#eff6ff', text: '#1d4ed8', border: '#60a5fa' },
  indicador: { bg: '#22c55e', light: '#f0fdf4', text: '#15803d', border: '#4ade80' },
} as const

type NodeCategory = keyof typeof NODE_COLORS

interface CMapNode {
  id: string; label: string; fullLabel: string; category: NodeCategory
  x: number; y: number; r: number
  frequencia?: number; detail?: string; sessoes?: number[]
  evolucao?: string; intensidade?: string; tendencia?: string
  isCategory?: boolean
}

function ConceptMap({ analise, paciente }: { analise: Analise | null; paciente?: string }) {
  const [selected, setSelected] = useState<CMapNode | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  if (!analise) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Network className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma análise disponível para gerar o mapa de conceitos.</p>
      </div>
    )
  }

  const W = 680, H = 480
  const cx = W / 2, cy = H / 2
  const sh = (s: string, n = 13) => s.length > n ? s.slice(0, n - 1) + '…' : s

  function itemPositions(catX: number, catY: number, count: number, dist = 100) {
    if (count === 0) return []
    const dir = Math.atan2(catY - cy, catX - cx)
    const spread = count <= 1 ? 0 : Math.min(1.8, (count - 1) * 0.5)
    return Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0 : (i / (count - 1) - 0.5) * 2
      const angle = dir + t * (spread / 2)
      return { x: catX + Math.cos(angle) * dist, y: catY + Math.sin(angle) * dist }
    })
  }

  const anchors = {
    padrao:    { x: cx - 188, y: cy - 110 },
    pessoa:    { x: cx + 188, y: cy - 110 },
    emocao:    { x: cx - 188, y: cy + 110 },
    indicador: { x: cx + 188, y: cy + 110 },
  }

  const nodes: CMapNode[] = []
  const edges: { x1:number; y1:number; x2:number; y2:number; cat:NodeCategory; dashed:boolean }[] = []

  nodes.push({ id:'patient', label: sh(paciente?.split(' ')[0]||'Paciente',11), fullLabel: paciente||'Paciente', category:'patient', x:cx, y:cy, r:32 })

  const groups: Array<{ key:NodeCategory; label:string; items:unknown[]; build:(item:unknown,pos:{x:number,y:number})=>CMapNode }> = [
    { key:'padrao', label:'Padrões', items: analise.padroes?.slice(0,6)||[],
      build:(p,pos)=>{ const item = p as Padrao; return { id:'padrao_'+item.tema, label:sh(item.tema), fullLabel:item.tema, category:'padrao', x:pos.x, y:pos.y, r:Math.max(12,Math.min(20,8+item.frequencia*1.8)), frequencia:item.frequencia, detail:item.observacao, sessoes:item.sessoes, evolucao:item.evolucao } } },
    { key:'pessoa', label:'Pessoas', items: analise.pessoas_citadas?.slice(0,6)||[],
      build:(p,pos)=>{ const item = p as Pessoa; return { id:'pessoa_'+item.nome_papel, label:sh(item.nome_papel), fullLabel:item.nome_papel, category:'pessoa', x:pos.x, y:pos.y, r:Math.max(12,Math.min(20,8+item.frequencia*1.8)), frequencia:item.frequencia, detail:item.contexto, sessoes:item.sessoes } } },
    { key:'emocao', label:'Emoções', items: analise.emocoes_dominantes?.slice(0,5)||[],
      build:(e,pos)=>{ const item = e as Emocao; return { id:'emocao_'+item.emocao, label:sh(item.emocao), fullLabel:item.emocao, category:'emocao', x:pos.x, y:pos.y, r:Math.max(12,Math.min(19,8+item.frequencia*1.8)), frequencia:item.frequencia, intensidade:item.intensidade } } },
    { key:'indicador', label:'Indicadores', items: analise.indicadores_progresso?.slice(0,5)||[],
      build:(ind,pos)=>{ const item = ind as Indicador; return { id:'indicador_'+item.indicador, label:sh(item.indicador), fullLabel:item.indicador, category:'indicador', x:pos.x, y:pos.y, r:13, detail:item.indicador, tendencia:item.tendencia } } },
  ]

  for (const g of groups) {
    const a = anchors[g.key as keyof typeof anchors]
    nodes.push({ id:'cat_'+g.key, label:g.label, fullLabel:g.label, category:g.key, x:a.x, y:a.y, r:22, isCategory:true })
    edges.push({ x1:cx, y1:cy, x2:a.x, y2:a.y, cat:g.key, dashed:false })
    const pos = itemPositions(a.x, a.y, g.items.length)
    g.items.forEach((item, i) => {
      nodes.push(g.build(item, pos[i]))
      edges.push({ x1:a.x, y1:a.y, x2:pos[i].x, y2:pos[i].y, cat:g.key, dashed:true })
    })
  }

  return (
    <div className="flex gap-4" style={{ minHeight: 480 }}>
      {/* Graph area */}
      <div className="flex-1 rounded-xl border border-gray-100 overflow-hidden" style={{ background:'linear-gradient(135deg,#f8faff 0%,#f0f4ff 50%,#f8fffe 100%)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 480 }}>
          <defs>
            {(Object.entries(NODE_COLORS) as [NodeCategory, typeof NODE_COLORS[NodeCategory]][]).map(([k,c]) => (
              <radialGradient key={k} id={`grad_${k}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor={c.border} />
                <stop offset="100%" stopColor={c.bg} />
              </radialGradient>
            ))}
          </defs>

          {/* Edges */}
          {edges.map((e,i) => {
            const col = NODE_COLORS[e.cat]
            return <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={col.bg} strokeWidth={e.dashed ? 1.2 : 2}
              strokeOpacity={e.dashed ? 0.3 : 0.45}
              strokeDasharray={e.dashed ? '5 4' : undefined} />
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const col = NODE_COLORS[node.category]
            const isSel = selected?.id === node.id
            const isHov = hoverId === node.id
            const filled = node.isCategory || node.id === 'patient'
            const lblY = filled ? 0 : (node.y > cy + 30 ? -(node.r + 11) : node.r + 12)
            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}
                onClick={() => setSelected(isSel ? null : node)}
                onMouseEnter={() => setHoverId(node.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{ cursor:'pointer' }}>
                {(isSel||isHov) && <circle r={node.r+(isSel?7:4)} fill="none" stroke={col.bg} strokeWidth={isSel?2.5:1.5} strokeOpacity={isSel?0.55:0.3} />}
                <circle r={node.r} fill={filled ? `url(#grad_${node.category})` : col.light} stroke={col.border} strokeWidth={isSel?2.5:1.5} strokeOpacity={0.85} />
                {filled ? (
                  <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize={node.id==='patient'?10:8.5} fontWeight="700">{node.label}</text>
                ) : node.frequencia !== undefined ? (
                  <text textAnchor="middle" dominantBaseline="central" fill={col.text} fontSize={9} fontWeight="800">{node.frequencia}x</text>
                ) : null}
                {!filled && <text textAnchor="middle" y={lblY} fill={col.text} fontSize={8} fontWeight="500" opacity={0.9}>{node.label}</text>}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Side panel */}
      <div className="w-56 flex flex-col gap-3 flex-shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex-1 overflow-hidden">
          {selected ? (
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: NODE_COLORS[selected.category].light, color: NODE_COLORS[selected.category].text }}>
                  {selected.isCategory ? 'Categoria' : selected.category === 'patient' ? 'Paciente' :
                   selected.category === 'padrao' ? 'Padrão' : selected.category === 'pessoa' ? 'Pessoa' :
                   selected.category === 'emocao' ? 'Emoção' : 'Indicador'}
                </span>
                <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-sm leading-none">×</button>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{selected.fullLabel}</p>
              {selected.frequencia !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: NODE_COLORS[selected.category].bg }}>{selected.frequencia}x</div>
                  <span className="text-xs text-gray-500">citações</span>
                </div>
              )}
              {selected.sessoes && selected.sessoes.length > 0 && (
                <p className="text-xs text-gray-400 mb-2">Sessões: {selected.sessoes.join(', ')}</p>
              )}
              {selected.evolucao && <p className="text-xs text-gray-600 mb-1">Evolução: <span className="font-medium">{selected.evolucao}</span></p>}
              {selected.intensidade && <p className="text-xs text-gray-600 mb-1">Intensidade: <span className="font-medium">{selected.intensidade}</span></p>}
              {selected.tendencia && <p className="text-xs text-gray-600 mb-1">Tendência: <span className="font-medium">{selected.tendencia}</span></p>}
              {selected.detail && !selected.isCategory && (
                <p className="text-xs text-gray-500 leading-relaxed mt-2 pt-2 border-t border-gray-50">{selected.detail}</p>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Legenda</p>
              {(Object.entries(NODE_COLORS) as [NodeCategory, typeof NODE_COLORS[NodeCategory]][]).map(([key, col]) => (
                <div key={key} className="flex items-center gap-2 mb-2.5">
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: col.bg }} />
                  <span className="text-xs text-gray-600">
                    {key==='patient'?'Paciente':key==='padrao'?'Padrões':key==='pessoa'?'Pessoas':key==='emocao'?'Emoções':'Indicadores'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-gray-300 mt-3 pt-2.5 border-t border-gray-50 leading-relaxed">
                Clique em um nó para ver detalhes. Tamanho proporcional à frequência.
              </p>
            </div>
          )}
        </div>

        {analise.alertas_clinicos?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex-shrink-0">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Alertas ({analise.alertas_clinicos.length})
            </p>
            {analise.alertas_clinicos.slice(0,2).map((a,i) => (
              <p key={i} className="text-xs text-amber-600 leading-relaxed mb-1 last:mb-0">{a}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────────────────────

export default function MapaLongitudinalPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aba, setAba] = useState<'analise' | 'timeline' | 'perguntas' | 'conceitos'>('analise')

  const [mapaMsg, setMapaMsg] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [mapaPergunta, setMapaPergunta] = useState('')
  const [mapaLoading, setMapaLoading] = useState(false)
  const mapaEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (id) load() }, [id])
  useEffect(() => { mapaEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mapaMsg])

  async function load() {
    setLoading(true)
    try {
      const res = await iaApi.analiseLongitudinal(id as string)
      setData(res)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar análise')
    } finally {
      setLoading(false)
    }
  }

  async function perguntarMapa() {
    if (!mapaPergunta.trim() || mapaLoading) return
    const pergunta = mapaPergunta.trim()
    const newMessages = [...mapaMsg, { role: 'user' as const, content: pergunta }]
    setMapaMsg(newMessages)
    setMapaPergunta('')
    setMapaLoading(true)
    try {
      const historico = mapaMsg.map(m => ({ role: m.role, content: m.content }))
      const res = await (await import('@/lib/api')).iaApi.coPiloto(pergunta, id as string, historico)
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: res.resposta }])
    } catch (e: unknown) {
      setMapaMsg([...newMessages, { role: 'assistant' as const, content: 'Erro: ' + (e instanceof Error ? e.message : 'tente novamente') }])
    } finally {
      setMapaLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Activity className="w-8 h-8 text-indigo-500 animate-pulse mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Analisando histórico clínico...</p>
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

  const analise = data?.analise as Analise | null
  const prontuarios = (data?.prontuarios as Prontuario[]) || []

  return (
    <div className={aba === 'conceitos' ? 'max-w-5xl mx-auto p-6' : 'max-w-4xl mx-auto p-6'}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/pacientes/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">Mapa Longitudinal</h1>
          </div>
          {data?.paciente != null && <p className="text-sm text-gray-500 ml-7">{data.paciente as string}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{(data?.total_sessoes as number) ?? 0}</p>
          <p className="text-xs text-indigo-600 mt-0.5">Sessões</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.padroes?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Padrões identificados</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{analise?.pessoas_citadas?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pessoas citadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {(['analise','timeline','perguntas','conceitos'] as const).map((key) => {
          const labels = { analise:'Análise', timeline:'Linha do Tempo', perguntas:'Perguntas', conceitos:'Conceitos' }
          const IconMap = { analise:BarChart2, timeline:FileText, perguntas:MessageSquare, conceitos:Network }
          const TabIcon = IconMap[key]
          return (
            <button key={key} onClick={() => setAba(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${aba === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <TabIcon className="w-4 h-4" />
              {labels[key]}
            </button>
          )
        })}
      </div>

      {/* ── ABA: ANÁLISE ── */}
      {aba === 'analise' && (
        <div className="space-y-5">
          {!analise ? (
            <div className="text-center py-12 text-gray-400">
              <Brain className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhuma análise disponível. Adicione prontuários primeiro.</p>
            </div>
          ) : (
            <>
              {analise.resumo_clinico && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-indigo-800">Resumo Clínico</h3>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed">{analise.resumo_clinico}</p>
                </div>
              )}

              {analise.padroes?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Padrões Recorrentes
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
                          {p.sessoes?.length > 0 && <p className="text-xs text-gray-400 mt-0.5">Sessões: {p.sessoes.join(', ')}</p>}
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
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Emoções Dominantes</h3>
                    <div className="space-y-2">
                      {analise.emocoes_dominantes.map((e, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100,(e.frequencia/((data?.total_sessoes as number)||1))*100)}%` }} />
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
                    <AlertTriangle className="w-4 h-4" /> Alertas Clínicos
                  </h3>
                  <ul className="space-y-1">
                    {analise.alertas_clinicos.map((a, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5"><span className="mt-1">•</span>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ABA: TIMELINE ── */}
      {aba === 'timeline' && (
        <div>
          {prontuarios.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>Nenhum registro clínico encontrado.</p>
            </div>
          ) : (
            prontuarios.map((p, i) => <TimelineCard key={p.id} p={p} index={i} />)
          )}
        </div>
      )}

      {/* ── ABA: PERGUNTAS ── */}
      {aba === 'perguntas' && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800">Perguntas ao Histórico</p>
            <p className="text-xs text-gray-400 mt-0.5">Ex: Quantas vezes ele citou a esposa? Houve evolução na queixa principal?</p>
          </div>
          {mapaMsg.length > 0 && (
            <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
              {mapaMsg.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.role === 'user' ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
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
              <p className="text-sm">Faça uma pergunta sobre o histórico do paciente</p>
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

      {/* ── ABA: CONCEITOS ── */}
      {aba === 'conceitos' && (
        <ConceptMap analise={analise} paciente={data?.paciente as string | undefined} />
      )}
    </div>
  )
}
