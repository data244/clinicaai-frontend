import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://clinicaai-backend-production.up.railway.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${BACKEND_URL}/api/v1/leads/beta-inscricao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, mensagem: data.detail ?? 'Erro ao registrar inscrição.' },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json(
      { ok: false, mensagem: 'Erro de conexão. Tente novamente.' },
      { status: 500 }
    )
  }
}
