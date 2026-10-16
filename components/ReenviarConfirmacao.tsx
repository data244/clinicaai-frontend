'use client'

import { useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import { Loader2, Mail } from 'lucide-react'

// Pede um novo link de confirmação de e-mail. O servidor responde sempre igual,
// para não revelar se o e-mail tem conta.
export default function ReenviarConfirmacao({ email: emailInicial = '', pedirEmail = false }: {
  email?: string
  pedirEmail?: boolean
}) {
  const [email, setEmail] = useState(emailInicial)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [espera, setEspera] = useState(0)

  useEffect(() => { setEmail(emailInicial) }, [emailInicial])

  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const reenviar = async () => {
    if (!email.trim()) { setAviso('Digite seu e-mail.'); return }
    setEnviando(true)
    setAviso('')
    try {
      const res = await authApi.reenviarConfirmacao(email.trim())
      setAviso(res.message)
      setEspera(60)
    } catch (e: unknown) {
      setAviso(e instanceof Error ? e.message : 'Não foi possível enviar agora. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-3">
      {pedirEmail && (
        <input
          type="email" className="input" placeholder="seu@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
        />
      )}
      <button
        type="button" onClick={reenviar} disabled={enviando || espera > 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-200 text-primary-700 font-medium rounded-lg hover:bg-primary-50 disabled:opacity-60 transition-colors text-sm"
      >
        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {espera > 0 ? `Pedir outro link em ${espera}s` : 'Enviar um novo link'}
      </button>
      {aviso && <p className="text-sm text-gray-600 text-center">{aviso}</p>}
    </div>
  )
}
