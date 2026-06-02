'use client'

import { useEffect, useState } from 'react'
import { pacientesApi } from '@/lib/api'
import { Paciente } from '@/types'
import Link from 'next/link'
import { Users, Search, Plus, Phone, Mail, Archive, RotateCcw, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [arquivados, setArquivados] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const [ativos, inativos] = await Promise.all([
        pacientesApi.list(),
        pacientesApi.listArquivados(),
      ])
      setPacientes(ativos)
      setArquivados(inativos)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const reativar = async (id: string) => {
    setProcessando(id)
    try {
      await pacientesApi.reativar(id)
      await carregar()
    } finally { setProcessando(null) }
  }

  const excluirDefinitivo = async (p: Paciente) => {
    if (!confirm(`Excluir PERMANENTEMENTE "${p.nome}"?\n\nTodos os dados no sistema serão apagados. O dossiê PDF no Alfresco será preservado (retenção 20 anos).\n\nEssa ação não pode ser desfeita.`)) return
    setProcessando(p.id)
    try {
      await pacientesApi.excluirDefinitivo(p.id)
      await carregar()
    } finally { setProcessando(null) }
  }

  const filtered = pacientes.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.telefone?.includes(search)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">{pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} ativo{pacientes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/pacientes/novo" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo paciente
        </Link>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista de ativos */}
      {loading ? (
        <div className="card text-center py-12 text-gray-400">Carregando pacientes...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {search ? 'Nenhum resultado encontrado' : 'Nenhum paciente cadastrado'}
          </p>
          {!search && (
            <Link href="/pacientes/novo" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
              + Cadastrar primeiro paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <Link key={p.id} href={`/pacientes/${p.id}`} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">{p.nome}</p>
                  {p.data_nascimento && (
                    <p className="text-xs text-gray-400 mt-0.5">Nasc: {formatDate(p.data_nascimento)}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {p.telefone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.telefone}
                      </p>
                    )}
                    {p.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" /> {p.email}
                      </p>
                    )}
                  </div>
                  {p.convenio && (
                    <span className="mt-2 inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.convenio}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Seção de arquivados */}
      {arquivados.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setMostrarArquivados(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <Archive className="w-4 h-4" />
            <span className="font-medium">Pacientes arquivados ({arquivados.length})</span>
            {mostrarArquivados ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {mostrarArquivados && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {arquivados.map((p, i) => (
                <div key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < arquivados.length - 1 ? 'border-b border-gray-100' : ''} bg-gray-50`}>
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-gray-500 font-medium text-sm">{p.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 truncate">{p.nome}</p>
                    {p.telefone && <p className="text-xs text-gray-400">{p.telefone}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => reativar(p.id)}
                      disabled={processando === p.id}
                      title="Reativar paciente"
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reativar
                    </button>
                    <button
                      onClick={() => excluirDefinitivo(p)}
                      disabled={processando === p.id}
                      title="Excluir permanentemente"
                      className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
