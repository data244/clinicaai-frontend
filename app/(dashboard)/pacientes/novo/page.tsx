'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { pacientesApi } from '@/lib/api'
import { ArrowLeft, Loader2, Zap, Lock } from 'lucide-react'
import Link from 'next/link'
import { assinaturaApi } from '@/lib/api'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional(),
  sexo: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  convenio: z.string().optional(),
  numero_convenio: z.string().optional(),
  observacoes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NovoPacientePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [trialLimit, setTrialLimit] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const clean = Object.fromEntries(Object.entries(data).filter(([,v]) => v !== '' && v != null))
      const p = await pacientesApi.create(clean)
      router.push(`/pacientes/${p.id}?import=1`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cadastrar paciente'
      if (msg.includes('TRIAL_LIMIT')) {
        setTrialLimit(true)
      } else {
        setError(msg)
      }
    }
  }


  const assinarAgora = async () => {
    setLoadingCheckout(true)
    try {
      const { init_point } = await assinaturaApi.checkoutTrial()
      window.location.href = init_point
    } catch {
      alert('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Modal: limite de pacientes beta */}
      {trialLimit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl mb-4">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Limite do beta atingido</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              O período beta permite até <strong>3 pacientes</strong>. Assine para adicionar pacientes ilimitados e desbloquear todos os recursos.
            </p>
            <button
              onClick={assinarAgora}
              disabled={loadingCheckout}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors mb-3"
            >
              <Zap className="w-4 h-4" />
              {loadingCheckout ? 'Aguarde...' : 'Assinar o Clínica.ai'}
            </button>
            <button
              onClick={() => setTrialLimit(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/pacientes" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Novo paciente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        {/* Nome */}
        <div>
          <label className="label">Nome completo *</label>
          <input className="input" placeholder="Maria da Silva" {...register('nome')} />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        {/* Dados pessoais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">CPF</label>
            <input className="input" placeholder="000.000.000-00" {...register('cpf')} />
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input type="date" className="input" {...register('data_nascimento')} />
          </div>
        </div>

        <div>
          <label className="label">Sexo</label>
          <select className="input" {...register('sexo')}>
            <option value="">Não informado</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Telefone</label>
            <input className="input" placeholder="(11) 99999-9999" {...register('telefone')} />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" placeholder="(11) 99999-9999" {...register('whatsapp')} />
          </div>
        </div>

        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" placeholder="paciente@email.com" {...register('email')} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Convênio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Convênio</label>
            <input className="input" placeholder="Unimed, Bradesco..." {...register('convenio')} />
          </div>
          <div>
            <label className="label">Nº carteirinha</label>
            <input className="input" placeholder="..." {...register('numero_convenio')} />
          </div>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea rows={3} className="input resize-none" placeholder="Informações adicionais..." {...register('observacoes')} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/pacientes" className="btn-secondary flex-1 text-center">Cancelar</Link>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Cadastrar paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}
