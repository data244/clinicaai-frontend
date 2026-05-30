'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from './api'

interface AuthContextType {
  token: string | null
  userId: string | null
  nome: string | null
  especialidade: string | null
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restaura sessão do localStorage
    const t = localStorage.getItem('clinicaai_token')
    const u = localStorage.getItem('clinicaai_user_id')
    const n = localStorage.getItem('clinicaai_nome')
    const e = localStorage.getItem('clinicaai_especialidade')
    if (t) { setToken(t); setUserId(u); setNome(n); setEspecialidade(e) }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('clinicaai_token', res.access_token)
    localStorage.setItem('clinicaai_user_id', res.user_id)
    localStorage.setItem('clinicaai_nome', res.nome || '')
    localStorage.setItem('clinicaai_especialidade', res.especialidade || '')
    setToken(res.access_token)
    setUserId(res.user_id)
    setNome(res.nome)
    setEspecialidade(res.especialidade)
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('clinicaai_token')
    localStorage.removeItem('clinicaai_user_id')
    localStorage.removeItem('clinicaai_nome')
    localStorage.removeItem('clinicaai_especialidade')
    setToken(null); setUserId(null); setNome(null); setEspecialidade(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ token, userId, nome, especialidade, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
