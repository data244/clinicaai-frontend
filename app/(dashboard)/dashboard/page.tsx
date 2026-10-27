'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { pacientesApi, agendaApi } from '@/lib/api'
import { Paciente } from '@/types'
import { Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import SeloFicticia from '@/components/SeloFicticia'

// Data local no formato aaaa-mm-dd (toISOString mudaria o dia à noite, por causa do fuso)
function dataLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Segunda a domingo da semana atual, como na Agenda
function semanaAtual(): [string, string] {
  const ini = new Date()
  const dia = ini.getDay()
  ini.setDate(ini.getDate() - dia + (dia === 0 ? -6 : 1))
  const fim = new Date(ini)
  fim.setDate(fim.getDate() + 6)
  return [dataLocal(ini), dataLocal(fim)]
}

export default function DashboardPage() {
  const { nome } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [sessoesSemana, setSessoesSemana] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pacientesApi.list().then(setPacientes).catch(console.error).finally(() => setLoading(false))
    const [ini, fim] = semanaAtual()
    agendaApi.listar(ini, fim)
      .then(r => setSessoesSemana(r.agendamentos.filter(a => a.status !== 'cancelado').length))
      .catch(() => setSessoesSemana(null))
  }, [])

  const stats = [
    { label: 'Pacientes ativos', value: loading ? '...' : pacientes.length, icon: Users, color: 'bg-blue-50 text-blue-600', href: '/pacientes' },
    { label: 'Sessões nesta semana', value: sessoesSemana ?? '...', icon: Calendar, color: 'bg-purple-50 text-purple-600', href: '/agenda' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {nome?.split(' ')[0] ?? 'Profissional'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Aqui está o resumo da sua clínica</p>
      </div>

      {/* Destaque: inteligência longitudinal */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-6 mb-8">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-white/70 mb-1">Inteligência longitudinal</p>
          <h2 className="text-xl font-bold leading-snug">Do histórico ao padrão: enxergue o que se repete no caso.</h2>
          <p className="text-sm text-white/80 mt-2 leading-relaxed">
            Cada atendimento alimenta uma leitura que mostra o que se repete no caso. Abra a
            <span className="font-semibold"> Análise Longitudinal</span> de um paciente para ver a análise, ou converse com o
            <span className="font-semibold"> Copiloto Clínico</span>.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/pacientes" className="bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg backdrop-blur">
              Ver pacientes
            </Link>
            <Link href="/copiloto" className="bg-white text-primary-700 hover:bg-white/90 transition-colors text-sm font-semibold px-3 py-1.5 rounded-lg">
              Abrir Copiloto
            </Link>
          </div>
        </div>
        {/* motivo: as sessões do caso (sem predição) */}
        <svg viewBox="0 0 300 120" className="absolute right-0 bottom-0 h-full w-1/2 opacity-30 hidden sm:block" fill="none" preserveAspectRatio="xMaxYMax meet">
          <polyline points="0,80 57,80 85,58 114,98 142,80 213,80 241,64 270,80 298,74"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="298" cy="74" r="5" fill="white" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Últimos pacientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pacientes recentes</h2>
          <Link href="/pacientes/novo" className="btn-primary text-sm py-1.5 px-3">
            + Novo paciente
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum paciente cadastrado ainda</p>
            <Link href="/pacientes/novo" className="text-primary-600 text-sm font-medium hover:underline mt-1 inline-block">
              Cadastrar primeiro paciente →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pacientes.slice(0, 5).map(p => (
              <Link key={p.id} href={`/pacientes/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-semibold text-sm">{p.nome.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">{p.nome}{p.ficticia && <SeloFicticia />}</p>
                  <p className="text-xs text-gray-400">{p.telefone ?? p.email ?? 'Sem contato'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
