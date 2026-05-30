'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pacientesApi, prontuariosApi } from '@/lib/api'
import { Paciente, Prontuario } from '@/types'
import { ArrowLeft, Phone, Mail, FileText, Plus, Calendar, TrendingUp, X, Mic, Save, Pencil } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const TIPOS = ['consulta', 'retorno', 'exame', 'evolucao', 'anamnese'] as const

interface ProntuarioForm {
  tipo: string
  queixa_principal: string
  anamnese: string
  exame_fisico: string
  hipotese_diagnostica: string
  conduta: string
  prescricao: string
  observacoes: string
}

const formVazio: ProntuarioForm = {
  tipo: 'consulta', queixa_principal: '', anamnese: '', exame_fisico: '',
  hipotese_diagnostica: '', conduta: '', prescricao: '', observacoes: '',
}

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de criação
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<ProntuarioForm>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Modal de edição
  const [editando, setEditando] = useState<Prontuario | null>(null)
  const [formEdit, setFormEdit] = useState<ProntuarioForm>(formVazio)
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const [erroEdit, setErroEdit] = useState('')

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [pac, prons] = await Promise.all([
          pacientesApi.get(id),
          prontuariosApi.listByPaciente(id),
        ])
        setPaciente(pac)
        setProntuarios(prons)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ---- Criação ----
  const abrirModal = () => { setForm(formVazio); setErro(''); setModalAberto(true) }
  const fecharModal = () => { if (!salvando) setModalAberto(false) }

  const handleSalvar = async () => {
    if (!form.queixa_principal.trim() && !form.anamnese.trim() && !form.conduta.trim()) {
      setErro('Preencha ao menos um campo clínico.')
      return
    }
    setSalvando(true); setErro('')
    try {
      const payload: Record<string, string> = { paciente_id: id, tipo: form.tipo }
      if (form.queixa_principal) payload.queixa_principal = form.queixa_principal
      if (form.anamnese) payload.anamnese = form.anamnese
      if (form.exame_fisico) payload.exame_fisico = form.exame_fisico
      if (form.hipotese_diagnostica) payload.hipotese_diagnostica = form.hipotese_diagnostica
      if (form.conduta) payload.conduta = form.conduta
      if (form.prescricao) payload.prescricao = form.prescricao
      if (form.observacoes) payload.observacoes = form.observacoes
      const novo = await prontuariosApi.create(payload)
      setProntuarios(prev => [novo, ...prev])
      setModalAberto(false)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar registro.')
    } finally {
      setSalvando(false)
    }
  }

  // ---- Edição ----
  const abrirEditar = (pr: Prontuario) => {
    setFormEdit({
      tipo: pr.tipo || 'consulta',
      queixa_principal: pr.queixa_principal || '',
      anamnese: pr.anamnese || '',
      exame_fisico: pr.exame_fisico || '',
      hipotese_diagnostica: pr.hipotese_diagnostica || '',
      conduta: pr.conduta || '',
      prescricao: pr.prescricao || '',
      observacoes: pr.observacoes || '',
    })
    setErroEdit('')
    setEditando(pr)
  }
  const fecharEditar = () => { if (!salvandoEdit) setEditando(null) }

  const handleSalvarEdit = async () => {
    if (!editando) return
    setSalvandoEdit(true); setErroEdit('')
    try {
      const payload: Record<string, string> = { tipo: formEdit.tipo }
      payload.queixa_principal = formEdit.queixa_principal
      payload.anamnese = formEdit.anamnese
      payload.exame_fisico = formEdit.exame_fisico
      payload.hipotese_diagnostica = formEdit.hipotese_diagnostica
      payload.conduta = formEdit.conduta
      payload.prescricao = formEdit.prescricao
      payload.observacoes = formEdit.observacoes
      const atualizado = await prontuariosApi.update(editando.id, payload)
      setProntuarios(prev => prev.map(p => p.id === editando.id ? atualizado : p))
      setEditando(null)
    } catch (e: unknown) {
      setErroEdit(e instanceof Error ? e.message : 'Erro ao salvar edição.')
    } finally {
      setSalvandoEdit(false)
    }
  }

  // ---- Arquivar paciente ----
  const handleDelete = async () => {
    if (!confirm('Arquivar este paciente?')) return
    try {
      await pacientesApi.delete(id)
      router.push('/pacientes')
    } catch (e) { console.error(e) }
  }

  // Helper campo textarea
  const campo = (label: string, key: keyof ProntuarioForm, rows: number, placeholder: string, isEdit: boolean) => {
    const val = isEdit ? formEdit[key] : form[key]
    const setter = isEdit
      ? (v: string) => setFormEdit(prev => ({ ...prev, [key]: v }))
      : (v: string) => setForm(prev => ({ ...prev, [key]: v }))
    const disabled = isEdit ? salvandoEdit : salvando
    return (
      <div key={key}>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <textarea
          value={val}
          onChange={e => setter(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
    )
  }

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>
  if (!paciente) return <div className="text-red-500 text-sm">Paciente não encontrado.</div>

  return (
    <>
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
            className="flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors border border-primary-200"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Mapa Longitudinal</span>
            <span className="sm:hidden">Mapa</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados do paciente */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-xl">{paciente.nome.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{paciente.nome}</p>
                  {paciente.data_nascimento && (
                    <p className="text-xs text-gray-400">{formatDate(paciente.data_nascimento)}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {paciente.telefone && (
                  <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{paciente.telefone}</p>
                )}
                {paciente.email && (
                  <p className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{paciente.email}</p>
                )}
                {paciente.convenio && (
                  <p className="text-gray-500">Convênio: <span className="font-medium">{paciente.convenio}</span></p>
                )}
                {paciente.observacoes && (
                  <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-100">{paciente.observacoes}</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href={`/pacientes/${id}/mapa`}
                  className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Ver mapa longitudinal
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Arquivar paciente
                </button>
              </div>
            </div>
          </div>

          {/* Prontuários */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Prontuários ({prontuarios.length})
                </h2>
                <button
                  onClick={abrirModal}
                  className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Novo registro
                </button>
              </div>

              {prontuarios.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum registro clínico ainda</p>
                  <button onClick={abrirModal} className="mt-3 text-sm text-primary-600 hover:text-primary-800 underline">
                    Criar primeiro registro
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {prontuarios.map(pr => (
                    <div key={pr.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                            {pr.tipo}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pr.data_atendimento || pr.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => abrirEditar(pr)}
                          className="text-gray-400 hover:text-primary-600 transition-colors p-1 rounded"
                          title="Editar registro"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {pr.queixa_principal && (
                        <p className="text-sm text-gray-700 font-medium">{pr.queixa_principal}</p>
                      )}
                      {pr.conduta && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pr.conduta}</p>
                      )}
                      {pr.resumo_ia && (
                        <div className="mt-2 bg-purple-50 text-purple-700 text-xs p-2 rounded border border-purple-100">
                          ✦ IA: {pr.resumo_ia}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: novo prontuário */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Novo registro clínico</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={salvando}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de atendimento</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {TIPOS.map(t => (<option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
                </select>
              </div>
              {campo('Queixa principal', 'queixa_principal', 2, 'Motivo da consulta...', false)}
              {campo('Anamnese', 'anamnese', 3, 'História clínica, contexto...', false)}
              {campo('Exame físico / observações clínicas', 'exame_fisico', 2, '', false)}
              {campo('Hipótese diagnóstica', 'hipotese_diagnostica', 2, '', false)}
              {campo('Conduta', 'conduta', 3, 'Intervenções, orientações, encaminhamentos...', false)}
              {campo('Prescrição', 'prescricao', 2, '', false)}
              {campo('Observações gerais', 'observacoes', 2, '', false)}
              {erro && (<p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>)}
            </div>
            <div className="px-5 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <Link href={`/pacientes/${id}/prontuario/novo`} className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <Mic className="w-4 h-4" /> Com áudio
              </Link>
              <button onClick={handleSalvar} disabled={salvando} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: editar prontuário */}
      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) fecharEditar() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Editar registro clínico</h2>
              <button onClick={fecharEditar} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={salvandoEdit}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de atendimento</label>
                <select
                  value={formEdit.tipo}
                  onChange={e => setFormEdit(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {TIPOS.map(t => (<option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
                </select>
              </div>
              {campo('Queixa principal', 'queixa_principal', 2, 'Motivo da consulta...', true)}
              {campo('Anamnese', 'anamnese', 3, 'História clínica, contexto...', true)}
              {campo('Exame físico / observações clínicas', 'exame_fisico', 2, '', true)}
              {campo('Hipótese diagnóstica', 'hipotese_diagnostica', 2, '', true)}
              {campo('Conduta', 'conduta', 3, 'Intervenções, orientações, encaminhamentos...', true)}
              {campo('Prescrição', 'prescricao', 2, '', true)}
              {campo('Observações gerais', 'observacoes', 2, '', true)}
              {erroEdit && (<p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erroEdit}</p>)}
            </div>
            <div className="px-5 pb-5 flex gap-3 justify-end border-t border-gray-100 pt-4">
              <button onClick={fecharEditar} disabled={salvandoEdit} className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSalvarEdit} disabled={salvandoEdit} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-60">
                <Save className="w-4 h-4" />
                {salvandoEdit ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
