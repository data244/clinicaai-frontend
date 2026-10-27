// Leo, 26/10: a Data aparece como empresa responsável só nas telas que levam ao
// pagamento, nos Termos e no rodapé; nunca em post, anúncio ou página de venda.
// 27/10: a conta do Mercado Pago passou a ser a da Data Gestão de Arquivos (CNPJ). Com o cartão na
// nossa página (opção B) a pessoa não vê a tela do Mercado Pago, e o nome na fatura do cartão está
// vazio: nenhuma tela promete qual nome aparece lá.
export function CobrancaPelaData({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 leading-relaxed ${className}`}>
      A cobrança é feita pela Data Gestão de Arquivos Ltda., empresa responsável pelo Clínica.ai, por meio do Mercado Pago.
    </p>
  )
}
