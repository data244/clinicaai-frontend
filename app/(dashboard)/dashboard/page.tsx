'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { pacientesApi } from '@/lib/api'
import { Paciente } from '@/types'
import { Users, FileText, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { nome } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pacientesApi.list().then(setPacientes).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Pacientes ativos', value: pacientes.length, icon: Users, color: 'bg-blue-50 text-blue-600', href: '/pacientes' },
    { label: 'Prontuários hoje', value: 0, icon: FileText, color: 'bg-green-50 text-green-600', href: '/prontuarios' },
    { label: 'Consultas esta semana', value: 0, icon: Calendar, color: 'bg-purple-50 text-purple-600', href: '/agenda' },
    { label: 'Análises longitudinais', value: pacientes.length, icon: TrendingUp, color: 'bg-orange-50 text-orange-600', href: '/pacientes' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {nome?.split(' ')[0] ?? 'Profissional'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Aqui está o resumo da sua clínica</p>
      </div>

      {/* Destaque: inteligência longitudinal preditiva */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-6 mb-8">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-white/70 mb-1">Inteligência longitudinal</p>
          <h2 className="text-xl font-bold leading-snug">Do histórico à predição — enxergue o que vem a seguir</h2>
          <p className="text-sm text-white/80 mt-2 leading-relaxed">
            Cada atendimento alimenta uma leitura que revela padrões e antecipa tendências. Abra o
            <span className="font-semibold"> Mapa Longitudinal</span> de um paciente para ver a análise, ou converse com o
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
        {/* motivo: registro -> predição */}
        <svg viewBox="0 0 300 120" className="absolute right-0 bottom-0 h-full w-1/2 opacity-30 hidden sm:block" fill="none" preserveAspectRatio="xMaxYMax meet">
          <polyline points="0,80 40,80 60,58 80,98 100,80 150,80 170,64 190,80 210,74"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="210,74 245,58 275,40 298,26"
            stroke="white" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="298" cy="26" r="5" fill="white" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : value}
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
                  <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
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
