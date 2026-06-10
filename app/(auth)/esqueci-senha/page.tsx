'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { request } from '@/lib/api'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true); setErro('')
    try {
      await request('/api/v1/auth/esqueci-senha', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false)
      setEnviado(true)
    } catch {
      setErro('Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="card text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifique seu e-mail</h2>
        <p className="text-sm text-gray-500 mb-6">
          Se <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em breve.
        </p>
        <Link href="/login" className="text-primary-600 text-sm font-medium hover:underline flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="card">
      <Link href="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Esqueceu sua senha?</h2>
      <p className="text-sm text-gray-500 mb-6">Digite seu e-mail e enviaremos um link para redefinir.</p>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="label">E-mail profissional</label>
          <input
            type="email" className="input" placeholder="voce@clinica.com"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : 'Enviar link de redefinição'}
        </button>
      </form>
    </div>
  )
}
