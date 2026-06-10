'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import { request } from '@/lib/api'

export default function ResetarSenhaPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string } | null>(null)
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    const type = params.get('type')
    if (access_token && refresh_token && type === 'recovery') {
      setTokens({ access_token, refresh_token })
    } else {
      setErro('Link inválido ou expirado. Solicite um novo reset de senha.')
    }
  }, [])

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokens) return
    if (nova.length < 6) { setErro('Mínimo 6 caracteres.'); return }
    if (nova !== confirma) { setErro('As senhas não coincidem.'); return }
    setLoading(true); setErro('')
    try {
      await request('/api/v1/auth/resetar-senha', {
        method: 'POST',
        body: JSON.stringify({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, nova_senha: nova, nova_senha_confirmacao: confirma }),
      }, false)
      setOk(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (ok) return (
    <div className="card text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Senha redefinida!</h2>
      <p className="text-sm text-gray-500">Redirecionando para o login...</p>
    </div>
  )

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Redefinir senha</h2>
      {erro && !tokens ? (
        <div className="text-center">
          <p className="text-red-600 text-sm mb-4">{erro}</p>
          <Link href="/esqueci-senha" className="text-primary-600 text-sm font-medium hover:underline">
            Solicitar novo link
          </Link>
        </div>
      ) : (
        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label className="label">Nova senha</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres"
              value={nova} onChange={e => setNova(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input type="password" className="input" placeholder="Repita a senha"
              value={confirma} onChange={e => setConfirma(e.target.value)} required />
          </div>
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading || !tokens}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar nova senha'}
          </button>
        </form>
      )}
    </div>
  )
}
