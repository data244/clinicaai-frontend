// Trava (27/10): só a Public Key do Mercado Pago (APP_USR- ou TEST- seguido de UUID) entra no código
// do navegador. Outro valor nessa variável (o token do servidor, por exemplo) é descartado no build,
// com aviso no log sem mostrar o valor; sem a chave, o cartão segue pelo site do Mercado Pago.
const chaveMp = (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '').trim().replace(/^["']|["']$/g, '').trim()
if (/^(APP_USR|TEST)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chaveMp)) {
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY = chaveMp
} else {
  if (chaveMp) {
    console.warn(`AVISO: NEXT_PUBLIC_MP_PUBLIC_KEY descartada (${chaveMp.length} caracteres, não é a Public Key do Mercado Pago). O cartão vai pelo site do Mercado Pago.`)
  }
  delete process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
}

/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
