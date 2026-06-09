'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from './api'

interface AuthContextType {
  token: string | null
  userId: string | null
  nome: string | null
  especialidade: string | null
  email: string | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [nome, setNome] = useState<string | null>(null)
  const [especialidade, setEspecialidade] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('clinicaai_token')
    const u = localStorage.getItem('clinicaai_user_id')
    const n = localStorage.getItem('clinicaai_nome')
    const e = localStorage.getItem('clinicaai_especialidade')
    const em = localStorage.getItem('clinicaai_email')
    const adm = localStorage.getItem('clinicaai_is_admin') === 'true'
    if (t) { setToken(t); setUserId(u); setNome(n); setEspecialidade(e); setEmail(em); setIsAdmin(adm) }
    setIsLoading(false)
  }, [])

  const login = async (emailInput: string, password: string) => {
    const res = await authApi.login(emailInput, password)
    const adminFlag = res.is_admin ?? false
    localStorage.setItem('clinicaai_token', res.access_token)
    localStorage.setItem('clinicaai_user_id', res.user_id)
    localStorage.setItem('clinicaai_nome', res.nome || '')
    localStorage.setItem('clinicaai_especialidade', res.especialidade || '')
    localStorage.setItem('clinicaai_email', emailInput)
    localStorage.setItem('clinicaai_is_admin', String(adminFlag))
    setToken(res.access_token)
    setUserId(res.user_id)
    setNome(res.nome)
    setEspecialidade(res.especialidade)
    setEmail(emailInput)
    setIsAdmin(adminFlag)
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('clinicaai_token')
    localStorage.removeItem('clinicaai_user_id')
    localStorage.removeItem('clinicaai_nome')
    localStorage.removeItem('clinicaai_especialidade')
    localStorage.removeItem('clinicaai_email')
    localStorage.removeItem('clinicaai_is_admin')
    setToken(null); setUserId(null); setNome(null); setEspecialidade(null)
    setEmail(null); setIsAdmin(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ token, userId, nome, especialidade, email, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
