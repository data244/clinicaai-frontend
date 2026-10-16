// Página pública de Termos de Uso ou Política de Privacidade.
// O texto vem de um arquivo em conteudo/ (lido na hora do build).
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { VERSAO_TERMOS } from '@/lib/termos'

// node vem do react-markdown e não pode ir para o HTML
const MD = {
  h1: ({ node, ...p }: any) => <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3" {...p} />,
  h2: ({ node, ...p }: any) => <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3" {...p} />,
  h3: ({ node, ...p }: any) => <h3 className="text-base font-semibold text-gray-800 mt-5 mb-1.5" {...p} />,
  p: ({ node, ...p }: any) => <p className="text-sm text-gray-600 leading-relaxed mb-3" {...p} />,
  ul: ({ node, ...p }: any) => <ul className="list-disc pl-5 space-y-1.5 mb-3 text-sm text-gray-600" {...p} />,
  ol: ({ node, ...p }: any) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-sm text-gray-600" {...p} />,
  li: ({ node, ...p }: any) => <li className="leading-relaxed" {...p} />,
  strong: ({ node, ...p }: any) => <strong className="font-semibold text-gray-900" {...p} />,
  em: ({ node, ...p }: any) => <em className="text-gray-700" {...p} />,
  a: ({ node, ...p }: any) => <a className="text-primary-600 hover:underline" {...p} />,
  table: ({ node, ...p }: any) => <table className="w-full text-sm text-gray-600 border border-gray-200 mb-3" {...p} />,
  th: ({ node, ...p }: any) => <th className="text-left font-semibold text-gray-900 border border-gray-200 px-2 py-1" {...p} />,
  td: ({ node, ...p }: any) => <td className="border border-gray-200 px-2 py-1 align-top" {...p} />,
}

export default function DocumentoLegal({ titulo, arquivo }: { titulo: string; arquivo: string }) {
  const texto = fs.readFileSync(path.join(process.cwd(), 'conteudo', arquivo), 'utf-8').trim()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-primary-600 hover:underline">← Clínica.ai</Link>
        <div className="card mt-4">
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-xs text-gray-400 mt-1 mb-6">Versão {VERSAO_TERMOS}</p>
          {texto
            ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{texto}</ReactMarkdown>
            : <p className="text-sm text-gray-500">Texto em preparação.</p>}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/termos" className="hover:underline">Termos de Uso</Link>
          {' · '}
          <Link href="/privacidade" className="hover:underline">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  )
}
