// Termos de Uso e Política de Privacidade.
// O texto fica em conteudo/termos-de-uso.md e conteudo/politica-de-privacidade.md
// (texto de vendas, aprovado pelo Leo). Ao trocar o texto, troque também a versão abaixo
// e a data "Em vigor desde" dos dois arquivos. A versão vai junto com o aceite no cadastro,
// gravada no perfil (termos_versao) com a hora do servidor (termos_aceitos_em).
export const VERSAO_TERMOS = '2026-10-28'

export const MSG_ACEITE = 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.'
export const MSG_ACEITE_CONTA = 'Para continuar, aceite os Termos de Uso e a Política de Privacidade.'

// Campos que o cadastro manda ao servidor quando a caixa está marcada
export const camposAceite = () => ({ aceite_termos: true, termos_versao: VERSAO_TERMOS })
