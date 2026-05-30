'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { prontuariosApi, pacientesApi, iaApi } from '@/lib/api'
import { Paciente, Prontuario } from '@/types'
import AudioRecorder from '@/components/ia/AudioRecorder'
import { Loader2, Sparkles, FileText, ChevronDown, ChevronUp, Mic } from 'lucide-react'

type FormData = {
  paciente_id: string
  tipo: string
  queixa_principal: string
  anamnese: string
  exame_fisico: string
  hipotese_diagnostica: string
  conduta: string
  prescricao: string
  observacoes: string
}

export default function ProntuariosPage() {
  const searchParams = useSearchParams()
  const preselectedPaciente = searchParams.get('paciente_id') || ''

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState(preselectedPaciente)
  const [resumoIA, setResumoIA] = useState('')
  const [salvandoResumo, setSalvandoResumo] = useState(false)
  const [prontuarioAtual, setProntuarioAtual] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { paciente_id: preselectedPaciente, tipo: 'consulta' }
  })

  useEffect(() => {
    pacientesApi.list().then(setPacientes).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedPaciente) {
      prontuariosApi.listByPaciente(selectedPaciente).then(setProntuarios).catch(console.error)
    }
  }, [selectedPaciente])

  const handleTranscricao = (texto: string) => {
    setValue('anamnese', texto)
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError('')
    try {
      const novo = await prontuariosApi.create(data)
      setProntuarioAtual(novo.id)
      setSuccess('Prontuário salvo!')
      setProntuarios(prev => [novo, ...prev])
      reset()
      setShowForm(false)

      // Gerar embedding automaticamente em background
      if (novo.id) {
        iaApi.gerarEmbedding(novo.id).catch(() => {})
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const gerarResumoIA = async (prontuarioId: string) => {
    setSalvandoResumo(true)
    setResumoIA('')
    try {
      const res = await iaApi.gerarResumo(prontuarioId)
      setResumoIA(res.resumo_ia)
      setProntuarios(prev => prev.map(p =>
        p.id === prontuarioId ? { ...p, resumo_ia: res.resumo_ia } : p
      ))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar resumo')
    } finally {
      setSalvandoResumo(false)
    }
  }

  const anamneseValue = watch('anamnese')

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prontuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registros clínicos com transcrição e IA</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {showForm ? 'Cancelar' : 'Novo registro'}
        </button>
      </div>

      {/* Formulário de novo prontuário */}
      {showForm && (
        <div className="card mb-6 border-primary-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary-500" />
            Novo registro clínico
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Paciente *</label>
                <select
                  className="input"
                  {...register('paciente_id', { required: true })}
                  onChange={e => { setSelectedPaciente(e.target.value); setValue('paciente_id', e.target.value) }}
                >
                  <option value="">Selecione um paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                {errors.paciente_id && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
              <div>
                <label className="label">Tipo de atendimento</label>
                <select className="input" {...register('tipo')}>
                  <option value="consulta">Consulta</option>
                  <option value="retorno">Retorno</option>
                  <option value="avaliacao">Avaliação</option>
                  <option value="anamnese">Anamnese</option>
                  <option value="evolucao">Evolução</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Queixa principal</label>
              <input className="input" placeholder="Motivo da consulta..." {...register('queixa_principal')} />
            </div>

            {/* Gravação / Transcrição */}
            <div>
              <label className="label flex items-center gap-2">
                Transcrição da consulta
                <span className="text-xs text-primary-500 font-normal bg-primary-50 px-2 py-0.5 rounded-full">
                  Groq Whisper
                </span>
              </label>
              <AudioRecorder onTranscricao={handleTranscricao} />
              {anamneseValue && (
                <div className="mt-3">
                  <label className="label">Texto transcrito (editável)</label>
                  <textarea
                    className="input min-h-[100px] resize-y"
                    {...register('anamnese')}
                    placeholder="Transcrição aparecerá aqui..."
                  />
                </div>
              )}
              {!anamneseValue && (
                <textarea
                  className="input mt-2 min-h-[80px] resize-y"
                  {...register('anamnese')}
                  placeholder="Ou digite a anamnese manualmente..."
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Exame físico</label>
                <textarea className="input resize-y" {...register('exame_fisico')} rows={2} />
              </div>
              <div>
                <label className="label">Hipótese diagnóstica</label>
                <textarea className="input resize-y" {...register('hipotese_diagnostica')} rows={2} />
              </div>
            </div>

            <div>
              <label className="label">Conduta / Plano terapêutico</label>
              <textarea className="input resize-y" {...register('conduta')} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prescrição</label>
                <textarea className="input resize-y" {...register('prescricao')} rows={2} />
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input resize-y" {...register('observacoes')} rows={2} />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg border border-green-200">{success}</div>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Salvar prontuário
              </button>
              {prontuarioAtual && (
                <button
                  type="button"
                  onClick={() => gerarResumoIA(prontuarioAtual)}
                  disabled={salvandoResumo}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {salvandoResumo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Resumo com IA
                </button>
              )}
            </div>
          </form>

          {/* Resumo IA */}
          {resumoIA && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Resumo gerado por Claude Haiku
              </p>
              <div className="text-sm text-purple-900 whitespace-pre-wrap">{resumoIA}</div>
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-3">
          <label className="label mb-0">Filtrar por paciente:</label>
          <select
            className="input max-w-xs"
            value={selectedPaciente}
            onChange={e => setSelectedPaciente(e.target.value)}
          >
            <option value="">Todos os pacientes</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        {prontuarios.length === 0 && selectedPaciente && (
          <div className="card text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum prontuário encontrado para este paciente.</p>
          </div>
        )}

        {prontuarios.map(pr => (
          <div key={pr.id} className="card hover:shadow-md transition-shadow">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === pr.id ? null : pr.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                  {pr.tipo}
                </span>
                <p className="text-sm font-medium text-gray-800">
                  {pr.queixa_principal || 'Sem queixa registrada'}
                </p>
                {pr.resumo_ia && (
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> IA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-xs">{new Date(pr.data_atendimento || '').toLocaleDateString('pt-BR')}</span>
                {expandedId === pr.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {expandedId === pr.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                {pr.anamnese && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Anamnese / Transcrição</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{pr.anamnese}</p>
                  </div>
                )}
                {pr.exame_fisico && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Exame Físico</p>
                    <p className="text-gray-700">{pr.exame_fisico}</p>
                  </div>
                )}
                {pr.hipotese_diagnostica && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Hipótese Diagnóstica</p>
                    <p className="text-gray-700">{pr.hipotese_diagnostica}</p>
                  </div>
                )}
                {pr.conduta && (
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Conduta</p>
                    <p className="text-gray-700">{pr.conduta}</p>
                  </div>
                )}
                {pr.resumo_ia && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Resumo por IA
                    </p>
                    <p className="text-purple-900 text-sm whitespace-pre-wrap">{pr.resumo_ia}</p>
                  </div>
                )}
                {!pr.resumo_ia && (
                  <button
                    type="button"
                    onClick={() => gerarResumoIA(pr.id)}
                    disabled={salvandoResumo}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                  >
                    {salvandoResumo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Gerar resumo com IA
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
