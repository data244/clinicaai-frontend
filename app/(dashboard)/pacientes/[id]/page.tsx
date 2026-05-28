'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pacientesApi, prontuariosApi } from '@/lib/api'
import { Paciente, Prontuario } from '@/types'
import {
  ArrowLeft, Phone, Mail, FileText, Plus, Calendar, Activity,
  ChevronDown, ChevronUp, Edit2, X, Save, User
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

function EditProntuarioModal({
  prontuario,
  onSave,
  onClose,
  saving,
}: {
  prontuario: Prontuario
  onSave: (data: Partial<Prontuario>) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    tipo: prontuario.tipo || 'consulta',
    queixa_principal: prontuario.queixa_principal || '',
    anamnese: prontuario.anamnese || '',
    exame_fisico: prontuario.exame_fisico || '',
    hipotese_diagnostica: prontuario.hipotese_diagnostica || '',
    conduta: prontuario.conduta || '',
    prescricao: prontuario.prescricao || '',
    observacoes: prontuario.observacoes || '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 py-8 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Editar prontuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de atendimento</label>
            <select value={form.tipo} onChange={set('tipo')} className="input text-sm w-full">
              <option value="consulta">Consulta</option>
              <option value="retorno">Retorno</option>
              <option value="avaliacao">Avaliacao</option>
              <option value="sessao">Sessao</option>
              <option value="evolucao">Evolucao</option>
              <option value="anamnese">Anamnese</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Queixa principal</label>
            <input value={form.queixa_principal} onChange={set('queixa_principal')} className="input text-sm w-full" placeholder="Motivo da consulta..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Anamnese / Relato</label>
            <textarea value={form.anamnese} onChange={set('anamnese')} rows={7} className="input text-sm w-full resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exame fisico</label>
            <textarea value={form.exame_fisico} onChange={set('exame_fisico')} rows={3} className="input text-sm w-full resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hipotese diagnostica</label>
            <textarea value={form.hipotese_diagnostica} onChange={set('hipotese_diagnostica')} rows={2} className="input text-sm w-full resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Conduta / Plano terapeutico</label>
            <textarea value={form.conduta} onChange={set('conduta')} rows={3} className="input text-sm w-full resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Prescricao</label>
            <textarea value={form.prescricao} onChange={set('prescricao')} rows={2} className="input text-sm w-full resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} className="input text-sm w-full resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Salvando...' : 'Salvar prontuario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditPacienteModal({
  paciente,
  onSave,
  onClose,
  saving,
}: {
  paciente: Paciente
  onSave: (data: Partial<Paciente>) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    nome: paciente.nome || '',
    telefone: paciente.telefone || '',
    email: paciente.email || '',
    whatsapp: paciente.whatsapp || '',
    data_nascimento: paciente.data_nascimento || '',
    sexo: paciente.sexo || '',
    convenio: paciente.convenio || '',
    numero_convenio: paciente.numero_convenio || '',
    observacoes: paciente.observacoes || '',
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> Editar paciente
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nome completo</label>
            <input value={form.nome} onChange={set('nome')} className="input text-sm w-full" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
              <input value={form.telefone} onChange={set('telefone')} className="input text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
              <input value={form.whatsapp} onChange={set('whatsapp')} className="input text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input value={form.email} onChange={set('email')} type="email" className="input text-sm w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data de nascimento</label>
              <input value={form.data_nascimento} onChange={set('data_nascimento')} type="date" className="input text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sexo</label>
              <select value={form.sexo} onChange={set('sexo')} className="input text-sm w-full">
                <option value="">Nao informado</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Convenio</label>
              <input value={form.convenio} onChange={set('convenio')} className="input text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nr convenio</label>
              <input value={form.numero_convenio} onChange={set('numero_convenio')} className="input text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observacoes</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} className="input text-sm w-full resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingPaciente, setEditingPaciente] = useState(false)
  const [editingProntuario, setEditingProntuario] = useState<Prontuario | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  const loadData = () => {
    setLoading(true)
    Promise.all([pacientesApi.get(id), prontuariosApi.listByPaciente(id)])
      .then(([p, pr]) => { setPaciente(p); setProntuarios(pr) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleDeletePaciente = async () => {
    if (!confirm('Arquivar este paciente?')) return
    await pacientesApi.delete(id)
    router.push('/pacientes')
  }

  const handleSavePaciente = async (data: Partial<Paciente>) => {
    setSaving(true)
    try {
      const updated = await pacientesApi.update(id, data)
      setPaciente(updated)
      setEditingPaciente(false)
    } catch { alert('Erro ao salvar paciente') }
    finally { setSaving(false) }
  }

  const handleSaveProntuario = async (data: Partial<Prontuario>) => {
    if (!editingProntuario) return
    setSaving(true)
    try {
      const updated = await prontuariosApi.update(editingProntuario.id, data)
      setProntuarios(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditingProntuario(null)
    } catch { alert('Erro ao salvar prontuario') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="text-gray-400 text-sm p-4">Carregando...</div>
  if (!paciente) return <div className="text-red-500 text-sm p-4">Paciente nao encontrado.</div>

  return (
    <>
      {editingPaciente && (
        <EditPacienteModal paciente={paciente} onSave={handleSavePaciente} onClose={() => setEditingPaciente(false)} saving={saving} />
      )}
      {editingProntuario && (
        <EditProntuarioModal prontuario={editingProntuario} onSave={handleSaveProntuario} onClose={() => setEditingProntuario(null)} saving={saving} />
      )}
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/pacientes" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
          </div>
          <Link
            href={`/pacientes/${id}/mapa`}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4" />
            Mapa Longitudinal
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-xl">{paciente.nome.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{paciente.nome}</p>
                    {paciente.data_nascimento && <p className="text-xs text-gray-400">{formatDate(paciente.data_nascimento)}</p>}
                  </div>
                </div>
                <button onClick={() => setEditingPaciente(true)} className="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded" title="Editar paciente">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {paciente.telefone && <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400 shrink-0" />{paciente.telefone}</p>}
                {paciente.email && <p className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400 shrink-0" />{paciente.email}</p>}
                {paciente.sexo && <p className="text-gray-500">Sexo: <span className="font-medium">{paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Feminino' : 'Outro'}</span></p>}
                {paciente.convenio && <p className="text-gray-500">Convenio: <span className="font-medium">{paciente.convenio}</span></p>}
                {paciente.observacoes && <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-50">{paciente.observacoes}</p>}
              </div>
              <button onClick={handleDeletePaciente} className="mt-4 text-xs text-red-400 hover:text-red-600 transition-colors">Arquivar paciente</button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Prontuarios ({prontuarios.length})
                </h2>
                <Link href={`/prontuarios?paciente_id=${id}`}>
                  <span className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Novo registro
                  </span>
                </Link>
              </div>
              {prontuarios.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum registro clinico ainda</p>
                  <Link href={`/prontuarios?paciente_id=${id}`} className="text-primary-600 text-xs mt-1 inline-block hover:underline">Criar primeiro registro</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {prontuarios.map(pr => {
                    const isOpen = expandedId === pr.id
                    return (
                      <div key={pr.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setExpandedId(isOpen ? null : pr.id)}>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">{pr.tipo}</span>
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(pr.data_atendimento)}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">{pr.queixa_principal || 'Sem queixa registrada'}</p>
                            {!isOpen && pr.anamnese && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pr.anamnese}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={e => { e.stopPropagation(); setEditingProntuario(pr) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Editar">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/30">
                            <Field label="Queixa principal" value={pr.queixa_principal} />
                            <Field label="Anamnese / Relato" value={pr.anamnese} />
                            <Field label="Exame fisico" value={pr.exame_fisico} />
                            <Field label="Hipotese diagnostica" value={pr.hipotese_diagnostica} />
                            <Field label="Conduta" value={pr.conduta} />
                            <Field label="Prescricao" value={pr.prescricao} />
                            <Field label="Observacoes" value={pr.observacoes} />
                            {!pr.queixa_principal && !pr.anamnese && !pr.conduta && !pr.hipotese_diagnostica && (
                              <p className="text-xs text-gray-400 italic py-3">Nenhum conteudo registrado.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
                                                                                                  }
