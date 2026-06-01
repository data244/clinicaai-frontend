'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Search, LifeBuoy } from 'lucide-react'
import { artigos, categorias } from '@/lib/ajuda-conteudo'

const MD = {
  h2: (p: any) => <h2 className="text-xl font-bold text-gray-900 mb-3" {...p} />,
  h3: (p: any) => <h3 className="text-base font-semibold text-gray-800 mt-5 mb-1.5" {...p} />,
  p: (p: any) => <p className="text-sm text-gray-600 leading-relaxed mb-3" {...p} />,
  ul: (p: any) => <ul className="list-disc pl-5 space-y-1.5 mb-3 text-sm text-gray-600" {...p} />,
  ol: (p: any) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-sm text-gray-600" {...p} />,
  li: (p: any) => <li className="leading-relaxed" {...p} />,
  strong: (p: any) => <strong className="font-semibold text-gray-900" {...p} />,
  em: (p: any) => <em className="text-gray-700" {...p} />,
  a: (p: any) => <a className="text-indigo-600 hover:underline" {...p} />,
  blockquote: (p: any) => (
    <blockquote className="border-l-4 border-indigo-300 bg-indigo-50 text-gray-700 text-sm rounded-r-lg px-4 py-2.5 my-3" {...p} />
  ),
}

export default function AjudaPage() {
  const [q, setQ] = useState('')
  const [slug, setSlug] = useState(artigos[0].slug)

  const termo = q.trim().toLowerCase()
  const filtrados = termo
    ? artigos.filter(a =>
        (a.titulo + ' ' + a.resumo + ' ' + a.conteudo).toLowerCase().includes(termo))
    : artigos
  const selecionado = artigos.find(a => a.slug === slug) ?? artigos[0]

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <LifeBuoy className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
      </div>
      <p className="text-sm text-gray-600 mb-5 ml-12">Guias rápidos para tirar o máximo do Clínica.ai.</p>

      <div className="relative mb-6 max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar na ajuda..."
          className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Lista de artigos */}
        <nav className="w-full lg:w-72 shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-5">
          {categorias.map(cat => {
            const itens = filtrados.filter(a => a.categoria === cat)
            if (itens.length === 0) return null
            return (
              <div key={cat}>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{cat}</p>
                <div className="space-y-1">
                  {itens.map(a => (
                    <button
                      key={a.slug}
                      onClick={() => setSlug(a.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        a.slug === selecionado.slug
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {a.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <p className="text-sm text-gray-400 px-1">Nada encontrado para “{q}”.</p>
          )}
        </nav>

        {/* Artigo */}
        <article className="flex-1 w-full bg-white border border-gray-100 rounded-xl shadow-sm p-6 lg:p-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
            {selecionado.conteudo}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
