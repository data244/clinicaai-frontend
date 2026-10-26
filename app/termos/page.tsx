import type { Metadata } from 'next'
import DocumentoLegal from '@/components/DocumentoLegal'

export const metadata: Metadata = { title: 'Termos de Uso | Clínica.ai' }

export default function TermosPage() {
  return <DocumentoLegal titulo="Termos de Uso" arquivo="termos-de-uso.md" />
}
