'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Clock } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [expirado, setExpirado] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expirado') === '1') setExpirado(true)
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    setExpirado(false)
    try {
      await login(data.email, data.password)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer login')
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar na conta</h2>
      {expirado && (
        <div className="bg-amber-50 text-amber-800 text-sm px-3 py-2 rounded-lg border border-amber-200 mb-4 flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Sua sessão expirou. Entre novamente para continuar.</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">E-mail profissional</label>
          <input type="email" className="input" placeholder="voce@clinica.com" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Senha</label>
          <input type="password" className="input" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
        </button>
        <div className="text-center">
          <Link href="/esqueci-senha" className="text-sm text-gray-400 hover:text-primary-600 transition-colors">
            Esqueceu sua senha?
          </Link>
        </div>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-primary-600 font-medium hover:underline">
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  )
}
