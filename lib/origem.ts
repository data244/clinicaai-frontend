// Medição do funil (item 6 do VENDAS.md, 21/10/2026).
// Origem: a primeira UTM que a pessoa traz (anúncio, bio, mensagem) fica guardada neste
// navegador e vai junto no cadastro. Sem UTM, nada é guardado e a conta conta como
// "direto ou orgânico".
// Cookies da Meta: a decisão da pessoa no aviso fica guardada aqui também; o Pixel só
// carrega com "aceito".

const CHAVE_ORIGEM = 'clinicaai_origem'
const CHAVE_COOKIES = 'clinicaai_cookies'
const CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

export type Origem = Partial<Record<(typeof CAMPOS)[number], string>>
export type DecisaoCookies = 'aceito' | 'recusado'

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

// Só nas páginas abertas ao público; nunca dentro do painel, onde há dado de paciente
const PAGINAS_MEDIDAS = ['/', '/cadastro', '/login', '/assinar', '/cartao']

export function paginaMedida(caminho: string | null): boolean {
  return !!caminho && PAGINAS_MEDIDAS.includes(caminho)
}

export function guardarOrigem(busca: string): void {
  try {
    if (localStorage.getItem(CHAVE_ORIGEM)) return
    const params = new URLSearchParams(busca)
    const origem: Origem = {}
    for (const campo of CAMPOS) {
      const valor = params.get(campo)?.trim()
      if (valor) origem[campo] = valor.slice(0, 200)
    }
    if (Object.keys(origem).length) localStorage.setItem(CHAVE_ORIGEM, JSON.stringify(origem))
  } catch {
    // navegador sem localStorage: segue sem origem
  }
}

export function lerOrigem(): Origem {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_ORIGEM) || '{}')
    const origem: Origem = {}
    for (const campo of CAMPOS) {
      if (typeof salvo[campo] === 'string' && salvo[campo]) origem[campo] = salvo[campo].slice(0, 200)
    }
    return origem
  } catch {
    return {}
  }
}

export function lerDecisaoCookies(): DecisaoCookies | null {
  try {
    const valor = localStorage.getItem(CHAVE_COOKIES)
    return valor === 'aceito' || valor === 'recusado' ? valor : null
  } catch {
    return null
  }
}

export function gravarDecisaoCookies(decisao: DecisaoCookies): void {
  try {
    localStorage.setItem(CHAVE_COOKIES, decisao)
  } catch {
    // sem localStorage o aviso volta na próxima visita
  }
}

function lerCookie(nome: string): string | undefined {
  try {
    const achado = document.cookie.split('; ').find((c) => c.startsWith(`${nome}=`))
    return achado ? decodeURIComponent(achado.slice(nome.length + 1)).slice(0, 200) : undefined
  } catch {
    return undefined
  }
}

// Vai no cadastro: a origem sempre; os identificadores da Meta só com os cookies aceitos
export function dadosDeMedicao(): Origem & { meta_aceitou?: boolean; meta_fbp?: string; meta_fbc?: string } {
  const origem = lerOrigem()
  if (!PIXEL_ID || lerDecisaoCookies() !== 'aceito') return origem
  return { ...origem, meta_aceitou: true, meta_fbp: lerCookie('_fbp'), meta_fbc: lerCookie('_fbc') }
}

// Link "Preferências de cookies" do rodapé: reabre o aviso em qualquer página
export const EVENTO_PREFERENCIAS_COOKIES = 'clinicaai:preferencias-cookies'

// Recusou depois de ter aceitado: tira os cookies que o Pixel gravou neste site
export function apagarCookiesMeta(): void {
  try {
    const partes = window.location.hostname.split('.')
    for (const nome of ['_fbp', '_fbc']) {
      document.cookie = `${nome}=; Max-Age=0; path=/`
      for (let i = 0; i < partes.length - 1; i++) {
        document.cookie = `${nome}=; Max-Age=0; path=/; domain=.${partes.slice(i).join('.')}`
      }
    }
  } catch {
    // sem acesso aos cookies: nada a apagar
  }
}
