import { NextResponse } from 'next/server'
import { artigos } from '@/lib/ajuda-conteudo'

// Os artigos da Central de Ajuda para a Marina (servidor, app/services/marina.py).
// Uma fonte só: artigo editado aqui vale para a tela e para a Marina.
export const dynamic = 'force-static'

export function GET() {
  return NextResponse.json({
    artigos: artigos.map(({ slug, titulo, categoria, resumo, conteudo }) => ({ slug, titulo, categoria, resumo, conteudo })),
  })
}
