'use client'

import { useState, useEffect } from 'react'
import { request } from '@/lib/api'
import {
  DollarSign, Plus, CheckCircle, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Loader2, Trash2, Search, ExternalLink, Link2,
  RefreshCw
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Paciente { id: string; nome: string; whatsapp?: string; telefone?: string }

type Recorrencia = 'nenhuma' | 'semanal' | 'quinzenal' | 'mensal'

interface Cobranca {
  id: string
  paciente_id: string
  descricao: string
  valor: number
  data_vencimento: string
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  recorrencia: Recorrencia
  cobranca_pai_id?: string
  observacoes?: string
  link_pagamento?: string
  data_pagamento?: string
  created_at: string
  pacientes?: Paciente
}

interface Resumo {
  total_pendente: number
  total_vencido: number
  total_pago_mes: number
  qtd_pendente: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(iso: string) {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

function statusConfig(s: string) {
  switch (s) {
    case 'pago':      return { label: 'Pago',      icon: CheckCircle, cls: 'bg-green-100 text-green-700 border-green-200' }
    case 'vencido':   return { label: 'Vencido',   icon: AlertCircle, cls: 'bg-red-100 text-red-700 border-red-200' }
    case 'cancelado': return { label: 'Cancelado', icon: XCircle,     cls: 'bg-gray-100 text-gray-500 border-gray-200' }
    default:          return { label: 'Pendente',  icon: Clock,       cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
  }
}

const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  nenhuma:   'Sem recorrência',
  semanal:   'Semanal',
  quinzenal: 'Quinzenal',
  mensal:    'Mensal',
}

// ─── Modal Nova Cobrança ──────────────────────────────────────────────────────

function ModalNovaCobranca({
  onClose, onSaved
}: { onClose: () => void; onSaved: () => void }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [form, setForm] = useState({
    paciente_id: '', descricao: '', valor: '', data_vencimento: '',
    recorrencia: 'nenhuma' as Recorrencia, observacoes: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    request<Paciente[]>('/api/v1/pacientes/').then(setPacientes).catch(() => {})
  }, [])

  async function salvar() {
    if (!form.paciente_id || !form.descricao || !form.valor || !form.data_vencimento) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await request('/api/v1/financeiro', {
        method: 'POST',
        body: JSON.stringify({
          paciente_id: form.paciente_id,
          descricao: form.descricao,
          valor: parseFloat(form.valor.replace(',', '.')),
          data_vencimento: form.data_vencimento,
          recorrencia: form.recorrencia,
          observacoes: form.observacoes || undefined,
        }),
      })
      onSaved()
      onClose()
    } catch (e: unknown) {
      setErro((e as Error).message || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Nova Cobrança</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Paciente *</label>
            <select
              value={form.paciente_id}
              onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">Selecione...</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Descrição *</label>
            <input
              type="text"
              placeholder="Ex: Consulta junho, Mensalidade"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">1º vencimento *</label>
              <input
                type="date"
                value={form.data_vencimento}
                onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Recorrência */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Recorrência</label>
            <div className="grid grid-cols-2 gap-2">
              {(['nenhuma', 'semanal', 'quinzenal', 'mensal'] as Recorrencia[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, recorrencia: r }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    form.recorrencia === r
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r !== 'nenhuma' && <RefreshCw className="w-3 h-3" />}
                  {RECORRENCIA_LABELS[r]}
                </button>
              ))}
            </div>
            {form.recorrencia !== 'nenhuma' && (
              <p className="text-xs text-primary-600 mt-1.5 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                A próxima cobrança será gerada automaticamente ao marcar como paga.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Opcional"
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>
          {erro && <p className="text-xs text-red-500">{erro}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card de Cobrança ─────────────────────────────────────────────────────────

function CobrancaCard({ c, onAtualizar }: { c: Cobranca; onAtualizar: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg = statusConfig(c.status)
  const Icon = cfg.icon
  const ehRecorrente = c.recorrencia && c.recorrencia !== 'nenhuma'

  async function marcarPago() {
    setLoading(true)
    try {
      await request(`/api/v1/financeiro/${c.id}/marcar-pago`, { method: 'POST' })
      onAtualizar()
    } finally { setLoading(false) }
  }

  async function cancelar() {
    if (!confirm('Cancelar esta cobrança?')) return
    setLoading(true)
    try {
      await request(`/api/v1/financeiro/${c.id}`, { method: 'DELETE' })
      onAtualizar()
    } finally { setLoading(false) }
  }

  async function gerarLink() {
    setLoading(true)
    try {
      const res = await request<{ link: string; sandbox: boolean }>(
        `/api/v1/financeiro/${c.id}/gerar-link`, { method: 'POST' }
      )
      onAtualizar()
      window.open(res.link, '_blank')
    } catch (e: unknown) {
      alert((e as Error).message || 'Erro ao gerar link')
    } finally { setLoading(false) }
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${c.status === 'cancelado' ? 'opacity-60' : ''}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-medium text-gray-900 truncate">{c.descricao}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 shrink-0 ${cfg.cls}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
            {ehRecorrente && (
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                <RefreshCw className="w-3 h-3" />
                {RECORRENCIA_LABELS[c.recorrencia]}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {c.pacientes?.nome} · Vence {fmtData(c.data_vencimento)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{fmtValor(c.valor)}</p>
        </div>
        <button className="text-gray-400 ml-1 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {c.observacoes && (
            <p className="text-xs text-gray-500">{c.observacoes}</p>
          )}
          {c.data_pagamento && (
            <p className="text-xs text-green-600">Pago em {fmtData(c.data_pagamento)}</p>
          )}
          {ehRecorrente && c.status === 'pago' && (
            <p className="text-xs text-purple-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Próxima cobrança gerada automaticamente.
            </p>
          )}
          {c.link_pagamento && (
            <a
              href={c.link_pagamento}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Ver link de pagamento
            </a>
          )}
          {c.status !== 'pago' && c.status !== 'cancelado' && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={marcarPago}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {ehRecorrente ? 'Pago — gerar próxima' : 'Marcar como pago'}
              </button>
              {!c.link_pagamento && (
                <button
                  onClick={gerarLink}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-200 text-primary-600 text-xs font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Gerar link MP
                </button>
              )}
              <button
                onClick={cancelar}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)

  useEffect(() => { carregar() }, [filtroStatus])

  async function carregar() {
    setLoading(true)
    try {
      const qs = filtroStatus ? `?status=${filtroStatus}` : ''
      const [res, res2] = await Promise.all([
        request<{ cobrancas: Cobranca[] }>(`/api/v1/financeiro${qs}`),
        request<Resumo>('/api/v1/financeiro/resumo/dashboard'),
      ])
      setCobrancas(res.cobrancas)
      setResumo(res2)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  const filtradas = cobrancas.filter(c =>
    !busca || c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    c.pacientes?.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500">Cobranças e lembretes automáticos</p>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova cobrança
        </button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pendente', value: fmtValor(resumo.total_pendente), color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Vencido',  value: fmtValor(resumo.total_vencido),  color: 'text-red-600 bg-red-50' },
            { label: 'Pago mês', value: fmtValor(resumo.total_pago_mes), color: 'text-green-600 bg-green-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className={`text-xs font-medium mb-1 ${color.split(' ')[0]}`}>{label}</p>
              <p className="text-base font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full text-sm pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="vencido">Vencido</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma cobrança encontrada.</p>
          <p className="text-xs mt-1">Crie a primeira clicando em "Nova cobrança".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(c => (
            <CobrancaCard key={c.id} c={c} onAtualizar={carregar} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && <ModalNovaCobranca onClose={() => setModal(false)} onSaved={carregar} />}
    </div>
  )
}
