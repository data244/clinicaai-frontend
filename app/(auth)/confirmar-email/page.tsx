'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import ReenviarConfirmacao from '@/components/ReenviarConfirmacao'
import { Loader2, MailCheck, AlertCircle } from 'lucide-react'

function ConfirmarEmailContent() {
  const token = useSearchParams().get('t') || ''
  const { entrarComSessao } = useAuth()
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [codigo, setCodigo] = useState(token ? '' : 'LINK_INVALIDO')

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 6) { setErro('A senha tem pelo menos 6 caracteres.'); return }
    setEnviando(true)
    setErro('')
    try {
      const res = await authApi.confirmarEmail(token, senha)
      // Conta nova: o próximo passo é o cartão (a tela manda ao painel quem já tem teste)
      entrarComSessao(res, '', '/cartao?passo=cartao')
    } catch (e: unknown) {
      setCodigo(e instanceof ApiError ? e.codigo || '' : '')
      setErro(e instanceof Error ? e.message : 'Não foi possível confirmar agora. Tente de novo em instantes.')
      setEnviando(false)
    }
  }

  if (codigo === 'LINK_INVALIDO') {
    return (
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Link expirado ou inválido</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Digite o e-mail do cadastro para receber um novo link de confirmação.
        </p>
        <ReenviarConfirmacao pedirEmail />
        <p className="text-center text-sm text-gray-500 mt-6">
          Já confirmou?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    )
  }

  if (codigo === 'SENHA_NAO_CONFERE') {
    return (
      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-2xl mb-4">
          <MailCheck className="w-6 h-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">E-mail já confirmado</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{erro}</p>
        <Link href="/login" className="btn-primary w-full inline-flex items-center justify-center">Ir para o login</Link>
        <div className="mt-4">
          <Link href="/esqueci-senha" className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Confirmar e-mail</h2>
      <p className="text-sm text-gray-500 mb-6">Digite a senha que você criou no cadastro para entrar.</p>
      <form onSubmit={confirmar} className="space-y-4">
        <div>
          <label className="label">Senha</label>
          <input
            type="password" className="input" placeholder="••••••••" autoFocus
            value={senha} onChange={e => setSenha(e.target.value)}
          />
        </div>
        {erro && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
            {erro}
          </div>
        )}
        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={enviando}>
          {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</> : 'Confirmar e entrar'}
        </button>
      </form>
    </div>
  )
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={<div className="card flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>}>
      <ConfirmarEmailContent />
    </Suspense>
  )
}
