'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { prontuariosApi, pacientesApi, iaApi } from '@/lib/api'
import { Paciente, Prontuario } from '@/types'
import AudioRecorder from '@/components/ia/AudioRecorder'
import { Loader2, Sparkles, FileText, ChevronDown, ChevronUp, Mic } from 'lucide-react'

type FormData = {
  paciente_id: string; tipo: string; queixa_principal: string
  anamnese: string; exame_fisico: string; hipotese_diagnostica: string
  conduta: string; prescricao: string; observacoes: string
}

export default function ProntuariosPage() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('paciente_id') || ''
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState(preselected)
  const [resumoPreview, setResumoPreview] = useState<Record<string, string>>({})
  const [gerandoResumo, setGerandoResumo] = useState<string | null>(null)
  const [prontuarioAtual, setProntuarioAtual] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: { paciente_id: preselected, tipo: 'consulta' }
  })

  useEffect(() => { pacientesApi.list().then(setPacientes).catch(console.error) }, [])
  useEffect(() => {
    if (selectedPaciente) prontuariosApi.listByPaciente(selectedPaciente).then(setProntuarios).catch(console.error)
  }, [selectedPaciente])

  const handleTranscricao = (texto: string) => setValue('anamnese', texto)

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true); setError('')
    try {
      const novo = await prontuariosApi.create(data)
      setProntuarioAtual(novo.id)
      setSuccess('Prontuario salvo!')
      setProntuarios(prev => [novo, ...prev])
      reset()
      setShowForm(false)
      if (novo.id) iaApi.gerarEmbedding(novo.id).catch(() => {})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally { setIsSubmitting(false) }
  }

  const gerarResumoIA = async (id: string) => {
    setGerandoResumo(id)
    try {
      const res = await iaApi.gerarResumo(id)
      setResumoPreview(prev => ({ ...prev, [id]: res.resumo_ia }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar resumo')
    } finally { setGerandoResumo(null) }
  }

  const anamneseValue = watch('anamnese')

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prontuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Registros clinicos com transcricao e IA</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />{showForm ? 'Cancelar' : 'Novo registro'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-primary-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary-500" />Novo registro clinico
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Paciente *</label>
                <select className="input" {...register('paciente_id', { required: true })}
                  onChange={e => { setSelectedPaciente(e.target.value); setValue('paciente_id', e.target.value) }}>
                  <option value="">Selecione...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" {...register('tipo')}>
                  <option value="consulta">Consulta</option>
                  <option value="retorno">Retorno</option>
                  <option value="avaliacao">Avaliacao</option>
                  <option value="anamnese">Anamnese</option>
                  <option value="evolucao">Evolucao</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Queixa principal</label>
              <input className="input" placeholder="Motivo da consulta..." {...register('queixa_principal')} />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                Transcricao da consulta
                <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full font-normal">Groq Whisper</span>
              </label>
              <AudioRecorder onTranscricao={handleTranscricao} />
              <textarea className="input mt-2 min-h-[80px] resize-y" {...register('anamnese')}
                placeholder={anamneseValue ? undefined : 'Ou digite a anamnese manualmente...'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Exame fisico</label><textarea className="input resize-y" {...register('exame_fisico')} rows={2} /></div>
              <div><label className="label">Hipotese diagnostica</label><textarea className="input resize-y" {...register('hipotese_diagnostica')} rows={2} /></div>
            </div>
            <div><label className="label">Conduta / Plano terapeutico</label><textarea className="input resize-y" {...register('conduta')} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Prescricao</label><textarea className="input resize-y" {...register('prescricao')} rows={2} /></div>
              <div><label className="label">Observacoes</label><textarea className="input resize-y" {...register('observacoes')} rows={2} /></div>
            </div>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg border border-green-200">{success}</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Salvar prontuario
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-gray-500 font-medium">Paciente:</span>
          <select className="input max-w-xs" value={selectedPaciente} onChange={e => setSelectedPaciente(e.target.value)}>
            <option value="">Todos</option>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        {prontuarios.length === 0 && selectedPaciente && (
          <div className="card text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum prontuario para este paciente.</p>
          </div>
        )}
        {prontuarios.map(pr => (
          <div key={pr.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === pr.id ? null : pr.id)}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">{pr.tipo}</span>
                <p className="text-sm font-medium text-gray-800">{pr.queixa_principal || 'Sem queixa registrada'}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="text-xs">{new Date(pr.data_atendimento || '').toLocaleDateString('pt-BR')}</span>
                {expandedId === pr.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            {expandedId === pr.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                {pr.anamnese && <div><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Anamnese</p><p className="text-gray-700 whitespace-pre-wrap">{pr.anamnese}</p></div>}
                {pr.exame_fisico && <div><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Exame Fisico</p><p className="text-gray-700">{pr.exame_fisico}</p></div>}
                {pr.hipotese_diagnostica && <div><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Hipotese</p><p className="text-gray-700">{pr.hipotese_diagnostica}</p></div>}
                {pr.conduta && <div><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Conduta</p><p className="text-gray-700">{pr.conduta}</p></div>}

                <div className="pt-2 border-t border-gray-50">
                  {resumoPreview[pr.id] ? (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-500 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Nota IA — apenas sugestao, nao faz parte do prontuario
                      </p>
                      <p className="text-purple-900 text-sm whitespace-pre-wrap">{resumoPreview[pr.id]}</p>
                    </div>
                  ) : (
                    <button type="button" onClick={() => gerarResumoIA(pr.id)} disabled={gerandoResumo === pr.id}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                      {gerandoResumo === pr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Gerar nota IA (somente preview)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
