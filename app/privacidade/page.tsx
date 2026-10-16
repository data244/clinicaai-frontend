import type { Metadata } from 'next'
import DocumentoLegal from '@/components/DocumentoLegal'

export const metadata: Metadata = { title: 'Política de Privacidade | Clínica.ai' }

export default function PrivacidadePage() {
  return <DocumentoLegal titulo="Política de Privacidade" arquivo="politica-de-privacidade.md" />
}
