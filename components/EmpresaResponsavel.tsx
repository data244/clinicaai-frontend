import Link from 'next/link'
import { BotaoPreferenciasCookies } from '@/components/Medicao'

// Leo, 26/10: a Data aparece como empresa responsável só nas telas que levam ao
// pagamento, nos Termos e no rodapé; nunca em post, anúncio ou página de venda.
// 27/10: a conta do Mercado Pago passou a ser a da Data Gestão de Arquivos (CNPJ), que lá aparece
// com o nome fantasia. O nome na fatura do cartão está vazio: nenhuma tela promete qual nome sai lá.
export function CobrancaPelaData({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 leading-relaxed ${className}`}>
      A cobrança é feita pela Data Gestão de Arquivos Ltda., empresa responsável pelo Clínica.ai, por meio do Mercado Pago, onde aparece como Data Gestão da Informação.
    </p>
  )
}

// Rodapé de todas as páginas: Termos, Política, cookies, razão social e CNPJ
// (Decreto 7.962/2013, art. 2º). Dados do Cartão CNPJ.
export function RodapeLegal({ escuro = false, centro = false, className = '' }: {
  escuro?: boolean; centro?: boolean; className?: string
}) {
  const link = escuro ? 'hover:text-white transition-colors' : 'hover:text-gray-600 hover:underline'
  return (
    <div className={`text-xs leading-relaxed ${escuro ? 'text-slate-500' : 'text-gray-400'} ${centro ? 'text-center' : ''} ${className}`}>
      <p className={`flex flex-wrap gap-x-4 gap-y-1 ${centro ? 'justify-center' : ''}`}>
        <Link href="/termos" className={link}>Termos de Uso</Link>
        <Link href="/privacidade" className={link}>Política de Privacidade</Link>
        <BotaoPreferenciasCookies className={link} />
      </p>
      <p className="mt-1.5">Data Gestão de Arquivos Ltda. · CNPJ 42.143.348/0001-88</p>
    </div>
  )
}
