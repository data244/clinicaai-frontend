'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import ReenviarConfirmacao from '@/components/ReenviarConfirmacao'
import AceiteTermos from '@/components/AceiteTermos'
import { camposAceite, MSG_ACEITE } from '@/lib/termos'
import { Loader2, MailCheck } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [enviadoPara, setEnviadoPara] = useState('')
  const [aceite, setAceite] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    if (!aceite) { setError(MSG_ACEITE); return }
    try {
      // A conta só entra depois de confirmar o e-mail pelo link
      const res = await authApi.register({ ...data, ...camposAceite() })
      setEnviadoPara(res.email || data.email)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar')
    }
  }

  if (enviadoPara) {
    return (
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
          <MailCheck className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirme seu e-mail</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-1">
          Enviamos um link para <strong className="text-gray-900">{enviadoPara}</strong>.
          Abra o e-mail e clique no link para entrar.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Os 14 dias de teste começam quando você confirmar.
        </p>
        <p className="text-xs text-gray-500 mb-3">Não chegou em alguns minutos? Veja a caixa de spam ou peça outro link.</p>
        <ReenviarConfirmacao email={enviadoPara} />
        <p className="text-center text-sm text-gray-500 mt-6">
          Já confirmou?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Criar conta gratuita</h2>
      <p className="text-sm text-gray-500 mb-6">14 dias grátis, sem cartão.</p>
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
            <select className="input" {...register('conselho')}>
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
        <AceiteTermos marcado={aceite} onChange={setAceite} />
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
