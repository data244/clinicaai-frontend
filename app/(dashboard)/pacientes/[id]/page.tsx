'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pacientesApi, prontuariosApi } from '@/lib/api'
import { Paciente, Prontuario } from '@/types'
import { ArrowLeft, Phone, Mail, FileText, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      pacientesApi.get(id),
      prontuariosApi.listByPaciente(id),
    ]).then(([p, pr]) => {
      setPaciente(p)
      setProntuarios(pr)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Arquivar este paciente?')) return
    await pacientesApi.delete(id)
    router.push('/pacientes')
  }

  if (loading) return <div className="text-gray-400 text-sm">Carregando...</div>
  if (!paciente) return <div className="text-red-500 text-sm">Paciente não encontrado.</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pacientes" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{paciente.nome}</h1>
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
                <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-50">{paciente.observacoes}</p>
              )}
            </div>
            <button onClick={handleDelete} className="mt-4 text-xs text-red-400 hover:text-red-600 transition-colors">
              Arquivar paciente
            </button>
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
              <button className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Novo registro
              </button>
            </div>

            {prontuarios.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum registro clínico ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prontuarios.map(pr => (
                  <div key={pr.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                        {pr.tipo}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(pr.data_atendimento)}
                      </span>
                    </div>
                    {pr.queixa_principal && (
                      <p className="text-sm text-gray-700 font-medium">{pr.queixa_principal}</p>
                    )}
                    {pr.conduta && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pr.conduta}</p>
                    )}
                    {pr.resumo_ia && (
                      <div className="mt-2 bg-purple-50 text-purple-700 text-xs p-2 rounded border border-purple-100">
                        🤖 {pr.resumo_ia}
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
  )
}
