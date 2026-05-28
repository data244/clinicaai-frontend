'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, FileText, Calendar, Settings2,
  LogOut, Stethoscope, Brain, Menu, X
} from 'lucide-react'

const nav = [
  { href: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/pacientes',   label: 'Pacientes',   icon: Users },
  { href: '/prontuarios', label: 'Prontuários', icon: FileText },
  { href: '/copiloto',    label: 'Copiloto IA', icon: Brain },
  { href: '/agenda',      label: 'Agenda',      icon: Calendar },
  { href: '/configuracoes', label: 'Configurações', icon: Settings2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { nome, especialidade, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavLink = ({ href, label, icon: Icon, onClick }: {
    href: string; label: string; icon: React.ElementType; onClick?: () => void
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        pathname.startsWith(href)
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white border-r border-gray-100 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Clínica.ai</p>
              <p className="text-xs text-gray-400">Prontuário inteligente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => <NavLink key={item.href} {...item} />)}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-sm">
                {nome?.charAt(0)?.toUpperCase() ?? 'P'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{nome ?? 'Profissional'}</p>
              <p className="text-xs text-gray-400 truncate">{especialidade ?? ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Clínica.ai</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-600 hover:text-gray-900"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Drawer */}
          <aside
            className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Clínica.ai</p>
                  <p className="text-xs text-gray-400">Prontuário inteligente</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {nav.map((item) => (
                <NavLink key={item.href} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-sm">
                    {nome?.charAt(0)?.toUpperCase() ?? 'P'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{nome ?? 'Profissional'}</p>
                  <p className="text-xs text-gray-400 truncate">{especialidade ?? ''}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors w-full"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-primary-600' : 'text-gray-400')} />
              <span className="leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
