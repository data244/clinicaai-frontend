'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  PIXEL_ID, paginaMedida, guardarOrigem, lerDecisaoCookies, gravarDecisaoCookies, type DecisaoCookies,
} from '@/lib/origem'

// Medição do funil (item 6 do VENDAS.md). Guarda a origem da visita e, só com
// NEXT_PUBLIC_META_PIXEL_ID preenchido e os cookies aceitos, carrega o Pixel da Meta
// nas páginas abertas ao público. Sem a variável, não aparece aviso nem carrega nada.

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: Fbq
  loaded: boolean
  version: string
  disablePushState?: boolean
  allowDuplicatePageViews?: boolean
}

declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq }
}

function carregarPixel(id: string) {
  if (window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.queue = []
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  // Só os eventos que mandamos: sem contar troca de página sozinho nem ler botões e textos
  fbq.disablePushState = true
  fbq.allowDuplicatePageViews = true
  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
  fbq('set', 'autoConfig', false, id)
  fbq('init', id)
}

export default function Medicao() {
  const caminho = usePathname()
  // undefined: decisão ainda não lida deste navegador
  const [decisao, setDecisao] = useState<DecisaoCookies | null | undefined>(undefined)

  useEffect(() => { setDecisao(lerDecisaoCookies()) }, [])

  useEffect(() => { guardarOrigem(window.location.search) }, [caminho])

  useEffect(() => {
    if (!PIXEL_ID || decisao !== 'aceito' || !paginaMedida(caminho)) return
    carregarPixel(PIXEL_ID)
    window.fbq?.('track', 'PageView')
  }, [caminho, decisao])

  if (!PIXEL_ID || decisao !== null || !paginaMedida(caminho)) return null

  const decidir = (escolha: DecisaoCookies) => {
    gravarDecisaoCookies(escolha)
    setDecisao(escolha)
  }

  return (
    <div role="region" aria-label="Aviso de cookies" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gray-700 leading-relaxed flex-1">
          Usamos cookies da Meta para saber se os anúncios trazem visitas. Você pode recusar: o site funciona do mesmo jeito.{' '}
          <Link href="/privacidade" className="text-primary-600 font-medium hover:underline">Política de Privacidade</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => decidir('recusado')} className="btn-secondary text-sm flex-1 sm:flex-none">Recusar</button>
          <button type="button" onClick={() => decidir('aceito')} className="btn-primary text-sm flex-1 sm:flex-none">Aceitar</button>
        </div>
      </div>
    </div>
  )
}
