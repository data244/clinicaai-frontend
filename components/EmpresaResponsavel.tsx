// Leo, 26/10: a Data aparece como empresa responsável só nas telas que levam ao
// pagamento, nos Termos e no rodapé; nunca em post, anúncio ou página de venda.
export function CobrancaPelaData({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 leading-relaxed ${className}`}>
      A cobrança é feita pela Data Gestão da Informação, empresa responsável pelo Clínica.ai, por meio do Mercado Pago.
    </p>
  )
}
