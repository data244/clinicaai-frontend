'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { dadosDeMedicao } from '@/lib/origem'
import ReenviarConfirmacao from '@/components/ReenviarConfirmacao'
import AceiteTermos from '@/components/AceiteTermos'
import { camposAceite, MSG_ACEITE } from '@/lib/termos'
import { Loader2, MailCheck } from 'lucide-react'

// Cadastro, tela 1 (Rascunho v2, item 1.10): nome, e-mail e senha; CRP opcional.
// Depois vêm a confirmação do e-mail e o cartão (tela /cartao, nos campos do Mercado Pago).
const schema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  crp: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const [error, setError] = useState('')
  const [enviadoPara, setEnviadoPara] = useState('')
  const [aceite, setAceite] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ crp, ...data }: FormData) => {
    setError('')
    if (!aceite) { setError(MSG_ACEITE); return }
    try {
      // A conta só entra depois de confirmar o e-mail pelo link
      const numero = crp?.trim()
      // Origem da visita (UTM), só com os cookies aceitos os identificadores da Meta, e o aceite dos Termos
      const conta = { ...data, ...dadosDeMedicao(), ...camposAceite() }
      const res = await authApi.register(numero ? { ...conta, conselho: 'CRP', numero_conselho: numero } : conta)
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
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Enviamos um link para <strong className="text-gray-900">{enviadoPara}</strong>. Abra o link para continuar.
        </p>
        <p className="text-xs text-gray-500 mb-3">Não chegou? Veja a caixa de spam ou peça outro link.</p>
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
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Começar 14 dias grátis</h2>
      <p className="text-sm text-gray-500 mb-6">14 dias grátis. Depois, R$ 99 por mês. Cancele no teste e não paga nada.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Nome completo *</label>
          <input className="input" placeholder="Seu nome" autoComplete="name" {...register('nome')} />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className="label">E-mail *</label>
          <input type="email" className="input" placeholder="voce@email.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Senha *</label>
          <input type="password" className="input" placeholder="Mínimo 6 caracteres" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">CRP (opcional)</label>
          <input className="input" placeholder="06/123456" {...register('crp')} />
        </div>
        <AceiteTermos marcado={aceite} onChange={setAceite} />
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</> : 'Criar conta'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  )
}
