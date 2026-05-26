'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  especialidade: z.string().optional(),
  conselho: z.string().optional(),
  numero_conselho: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await authApi.register(data)
      localStorage.setItem('clinicaai_token', res.access_token)
      localStorage.setItem('clinicaai_user_id', res.user_id)
      localStorage.setItem('clinicaai_nome', res.nome || '')
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar')
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Criar conta gratuita</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Nome completo *</label>
          <input className="input" placeholder="Dr. João Silva" {...register('nome')} />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="label">E-mail *</label>
          <input type="email" className="input" placeholder="voce@clinica.com" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Senha *</label>
          <input type="password" className="input" placeholder="Mínimo 6 caracteres" {...register('password')} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Conselho</label>
            <select className="input" {...register('onselho')}>
              <option value="">Selecione</option>
              <option value="CRM">CRM</option>
              <option value="CRP">CRP</option>
              <option value="CRO">CRO</option>
              <option value="COREN">COREN</option>
              <option value="CRN">CRN</option>
              <option value="CREFITO">CREFITO</option>
            </select>
          </div>
          <div>
            <label className="label">Nº do conselho</label>
            <input className="input" placeholder="123456" {...register('numero_conselho')} />
          </div>
        </div>
        <div>
          <label className="label">Especialidade</label>
          <input className="input" placeholder="Psicologia, Clínica Geral..." {...register('especialidade')} />
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : 'Criar conta grátis'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  )
}
