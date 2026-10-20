import { redirect } from 'next/navigation'

// O cadastro por convite acabou em 20/10/2026: quem chega aqui faz o cadastro com o cartão.
// As contas beta que já existem continuam como estão.
export default function RegistrarBetaPage() {
  redirect('/cadastro')
}
