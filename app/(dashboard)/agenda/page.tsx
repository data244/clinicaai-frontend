'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, FileText, AlertCircle } from 'lucide-react'
import { agendaApi, pacientesApi, Agendamento } from '@/lib/api'

// ── Helpers de data ────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // segunda-feira
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HORAS = Array.from({ length: 14 }, (_, i) => i + 7) // 07h às 20h

// ── Cores por tipo ─────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  consulta: { label: 'Consulta',  color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-400' },
  retorno:  { label: 'Retorno',   color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-400' },
  exame:    { label: 'Exame',     color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-400' },
  bloqueio: { label: 'Bloqueio',  color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-400' },
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  agendado:   { label: 'Agendado',   dot: 'bg-blue-400' },
  confirmado: { label: 'Confirmado', dot: 'bg-green-500' },
  cancelado:  { label: 'Cancelado',  dot: 'bg-red-400' },
  realizado:  { label: 'Realizado',  dot: 'bg-gray-400' },
}

// ── Modal de agendamento ───────────────────────────────────────────────────────

interface ModalProps {
  evento: Partial<Agendamento> | null
  pacientes: { id: string; nome: string }[]
  onClose: () => void
  onSave: (data: Partial<Agendamento>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

function ModalAgendamento({ evento, pacientes, onClose, onSave, onDelete }: ModalProps) {
  const isNew = !evento?.id
  const [form, setForm] = useState({
    titulo: evento?.titulo || '',
    paciente_id: evento?.paciente_id || '',
    data_hora_inicio: evento?.data_hora_inicio?.slice(0, 16) || '',
    data_hora_fim: evento?.data_hora_fim?.slice(0, 16) || '',
    tipo: evento?.tipo || 'consulta',
    status: evento?.status || 'agendado',
    observacoes: evento?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!form.titulo || !form.data_hora_inicio || !form.data_hora_fim) {
      setErro('Preencha título, data/hora início e fim.')
      return
    }
    setLoading(true)
    try {
      await onSave({
        ...form,
        paciente_id: form.paciente_id || null,
        id: evento?.id,
      })
      onClose()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!evento?.id || !onDelete) return
    if (!confirm('Cancelar este agendamento?')) return
    setLoading(true)
    try {
      await onDelete(evento.id)
      onClose()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? 'Novo Agendamento' : 'Editar Agendamento'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Consulta Inicial"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          {/* Paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={14} className="inline mr-1" />Paciente
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.paciente_id}
              onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
            >
              <option value="">— Sem paciente vinculado —</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} className="inline mr-1" />Início *
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.data_hora_inicio}
                onChange={e => setForm(f => ({ ...f, data_hora_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.data_hora_fim}
                onChange={e => setForm(f => ({ ...f, data_hora_fim: e.target.value }))}
              />
            </div>
          </div>

          {/* Tipo + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Agendamento['tipo'] }))}
              >
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Agendamento['status'] }))}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText size={14} className="inline mr-1" />Observações
            </label>
            <textarea
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Notas adicionais..."
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle size={16} /> {erro}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2">
            {!isNew && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-2"
              >
                Cancelar consulta
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function AgendaPage() {
  const [semanaAtual, setSemanaAtual] = useState<Date>(() => startOfWeek(new Date()))
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<Agendamento> | null | false>(false)
  const [eventoClick, setEventoClick] = useState<Agendamento | null>(null)

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaAtual, i))

  // Carregar agendamentos da semana
  const carregarAgendamentos = useCallback(async () => {
    setLoading(true)
    try {
      const inicio = isoDate(semanaAtual)
      const fim = isoDate(addDays(semanaAtual, 6))
      const res = await agendaApi.listar(inicio, fim)
      setAgendamentos(res.agendamentos)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [semanaAtual])

  useEffect(() => {
    carregarAgendamentos()
  }, [carregarAgendamentos])

  // Carregar pacientes (uma vez)
  useEffect(() => {
    pacientesApi.list().then(lista => {
      setPacientes((lista as { id: string; nome: string }[]) || [])
    }).catch(console.error)
  }, [])

  // Agendar em slot específico
  const abrirNovoEmSlot = (dia: Date, hora: number) => {
    const inicio = new Date(dia)
    inicio.setHours(hora, 0, 0, 0)
    const fim = new Date(inicio)
    fim.setHours(hora + 1)
    setModal({
      data_hora_inicio: inicio.toISOString().slice(0, 16),
      data_hora_fim: fim.toISOString().slice(0, 16),
    })
  }

  const handleSave = async (data: Partial<Agendamento>) => {
    if (data.id) {
      await agendaApi.atualizar(data.id, data)
    } else {
      await agendaApi.criar(data as Omit<Agendamento, 'id' | 'profissional_id' | 'pacientes'>)
    }
    await carregarAgendamentos()
  }

  const handleDelete = async (id: string) => {
    await agendaApi.cancelar(id)
    await carregarAgendamentos()
  }

  // Filtrar agendamentos por dia+hora
  const agendamentosNoDia = (dia: Date): Agendamento[] => {
    const diaStr = isoDate(dia)
    return agendamentos.filter(a => a.data_hora_inicio.startsWith(diaStr))
  }

  const agendamentosNoSlot = (dia: Date, hora: number): Agendamento[] => {
    return agendamentosNoDia(dia).filter(a => {
      const h = new Date(a.data_hora_inicio).getHours()
      return h === hora
    })
  }

  const hoje = isoDate(new Date())

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 capitalize">{formatMonthYear(semanaAtual)}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação semana */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSemanaAtual(d => addDays(d, -7))}
              className="p-1.5 hover:bg-white rounded-md transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => setSemanaAtual(startOfWeek(new Date()))}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded-md"
            >
              Hoje
            </button>
            <button
              onClick={() => setSemanaAtual(d => addDays(d, 7))}
              className="p-1.5 hover:bg-white rounded-md transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Novo agendamento */}
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Novo
          </button>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-white border-b sticky top-0 z-10">
            <div className="p-2" />
            {diasSemana.map((dia, i) => {
              const diaStr = isoDate(dia)
              const isHoje = diaStr === hoje
              return (
                <div key={i} className={`p-3 text-center border-l ${isHoje ? 'bg-indigo-50' : ''}`}>
                  <div className="text-xs font-medium text-gray-500 uppercase">{DIAS_SEMANA[i]}</div>
                  <div className={`text-lg font-bold mt-0.5 ${isHoje ? 'text-indigo-600' : 'text-gray-800'}`}>
                    {dia.getDate()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {agendamentosNoDia(dia).length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px]">
                        {agendamentosNoDia(dia).length}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slots de hora */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            HORAS.map(hora => (
              <div key={hora} className="grid grid-cols-[60px_repeat(7,1fr)] border-b hover:bg-gray-50/50">
                {/* Label hora */}
                <div className="p-2 text-right pr-3 pt-2">
                  <span className="text-xs text-gray-400 font-mono">{formatHour(hora)}</span>
                </div>

                {/* Colunas por dia */}
                {diasSemana.map((dia, i) => {
                  const slots = agendamentosNoSlot(dia, hora)
                  const isHoje = isoDate(dia) === hoje
                  return (
                    <div
                      key={i}
                      className={`border-l min-h-[52px] p-1 cursor-pointer group relative
                        ${isHoje ? 'bg-indigo-50/40' : 'hover:bg-indigo-50/30'}`}
                      onClick={() => slots.length === 0 && abrirNovoEmSlot(dia, hora)}
                    >
                      {/* Botão + ao hover */}
                      {slots.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={14} className="text-indigo-300" />
                        </div>
                      )}

                      {/* Eventos no slot */}
                      {slots.map(ev => {
                        const cfg = TIPO_CONFIG[ev.tipo] || TIPO_CONFIG.consulta
                        const sCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.agendado
                        const cancelado = ev.status === 'cancelado'
                        return (
                          <div
                            key={ev.id}
                            onClick={e => { e.stopPropagation(); setEventoClick(ev) }}
                            className={`rounded-md border-l-2 px-2 py-1 text-xs mb-1 cursor-pointer
                              ${cfg.bg} ${cfg.border} ${cfg.color}
                              ${cancelado ? 'opacity-50 line-through' : 'hover:brightness-95'}
                              transition-all`}
                          >
                            <div className="flex items-center gap-1 font-medium truncate">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sCfg.dot}`} />
                              {ev.titulo}
                            </div>
                            {ev.pacientes && (
                              <div className="text-[10px] opacity-70 truncate mt-0.5">
                                {ev.pacientes.nome}
                              </div>
                            )}
                            <div className="text-[10px] opacity-60 mt-0.5">
                              {new Date(ev.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' – '}
                              {new Date(ev.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-t text-xs text-gray-500">
        {Object.entries(TIPO_CONFIG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm border-l-2 ${v.bg} ${v.border}`} />
            {v.label}
          </div>
        ))}
        <span className="ml-auto text-gray-400">
          Clique em um slot para criar • Clique em um evento para editar
        </span>
      </div>

      {/* Modal detalhe do evento */}
      {eventoClick && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEventoClick(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{eventoClick.titulo}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${TIPO_CONFIG[eventoClick.tipo]?.bg} ${TIPO_CONFIG[eventoClick.tipo]?.color}`}>
                  {TIPO_CONFIG[eventoClick.tipo]?.label}
                </span>
              </div>
              <button onClick={() => setEventoClick(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                {new Date(eventoClick.data_hora_inicio).toLocaleString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                })}
                {' – '}
                {new Date(eventoClick.data_hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {eventoClick.pacientes && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  {eventoClick.pacientes.nome}
                </div>
              )}
              {eventoClick.observacoes && (
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-gray-400 mt-0.5" />
                  <span>{eventoClick.observacoes}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[eventoClick.status]?.dot}`} />
                {STATUS_CONFIG[eventoClick.status]?.label}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setModal(eventoClick); setEventoClick(null) }}
                className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => setEventoClick(null)}
                className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal !== false && (
        <ModalAgendamento
          evento={modal}
          pacientes={pacientes}
          onClose={() => setModal(false)}
          onSave={handleSave}
          onDelete={modal?.id ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
