'use client'

import { useState } from 'react'
import {
  GraduationCap, Info, Loader2, Copy, Check, RefreshCw, History,
  ClipboardList, TrendingUp, HelpCircle, AlertTriangle, PenLine, ChevronDown, ChevronUp,
} from 'lucide-react'
import { supervisaoApi, SupervisaoConteudo, SupervisaoRegistro } from '@/lib/api'

const TENDENCIA_CLS: Record<string, string> = {
  crescente: 'bg-red-100 text-red-700',
  decrescente: 'bg-green-100 text-green-700',
  'estável': 'bg-gray-100 text-gray-600',
  estavel: 'bg-gray-100 text-gray-600',
  flutuante: 'bg-yellow-100 text-yellow-700',
}

function Bloco({ icon: Icon, titulo, children }: {
  icon: React.ComponentType<{ className?: string }>
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
      </div>
      {children}
    </section>
  )
}

function montarTexto(c: SupervisaoConteudo, notas: string): string {
  const l: string[] = []
  l.push(`PREPARAÇÃO PARA SUPERVISÃO — ${c._paciente || 'Paciente'}`)
  l.push(`${c._total_sessoes ?? 0} sessões registradas`)
  l.push('')
  if (c.resumo_caso) {
    l.push('RESUMO DO CASO')
    l.push(c.resumo_caso, '')
  }
  if (c.evolucao_recente?.length) {
    l.push('EVOLUÇÃO RECENTE')
    c.evolucao_recente.forEach(e => l.push(`• ${e.sessao}: ${e.destaque}`))
    l.push('')
  }
  if (c.padroes?.length) {
    l.push('PADRÕES IDENTIFICADOS')
    c.padroes.forEach(p => {
      const s = p.sessoes?.length ? ` (sessões ${p.sessoes.join(', ')})` : ''
      l.push(`• ${p.tema} [${p.tendencia}]${s}: ${p.observacao}`)
    })
    l.push('')
  }
  if (c.perguntas_supervisao?.length) {
    l.push('PERGUNTAS PARA A SUPERVISÃO')
    c.perguntas_supervisao.forEach((q, i) => l.push(`${i + 1}. ${q}`))
    l.push('')
  }
  if (c.pontos_atencao?.length) {
    l.push('PONTOS DE ATENÇÃO')
    c.pontos_atencao.forEach(p => l.push(`• ${p}`))
    l.push('')
  }
  if (notas.trim()) {
    l.push('MINHAS ANOTAÇÕES')
    l.push(notas.trim(), '')
  }
  l.push('---')
  l.push('Gerado pelo Clínica.ai como apoio à preparação para supervisão.')
  l.push('Não substitui o julgamento clínico do supervisor.')
  return l.join('\n')
}

export default function SupervisaoTab({ pacienteId }: { pacienteId: string }) {
  const [conteudo, setConteudo] = useState<SupervisaoConteudo | null>(null)
  const [supervisaoId, setSupervisaoId] = useState<string | null>(null)
  const [notas, setNotas] = useState('')
  const [notasSalvas, setNotasSalvas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const [historico, setHistorico] = useState<SupervisaoRegistro[]>([])
  const [mostrarHist, setMostrarHist] = useState(false)
  const [loadingHist, setLoadingHist] = useState(false)

  const gerar = async () => {
    setLoading(true); setErro(null)
    try {
      const r = await supervisaoApi.gerar(pacienteId, notas || undefined)
      setConteudo(r.conteudo)
      setSupervisaoId(r.id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar análise.'
      setErro(msg.includes('SEM_SESSOES')
        ? 'Registre ao menos uma sessão deste paciente antes de preparar a supervisão.'
        : msg)
    } finally { setLoading(false) }
  }

  const salvarNotas = async () => {
    if (!supervisaoId) return
    try {
      await supervisaoApi.salvarNotas(pacienteId, supervisaoId, notas)
      setNotasSalvas(true)
      setTimeout(() => setNotasSalvas(false), 2000)
    } catch { /* silencioso */ }
  }

  const copiarTudo = () => {
    if (!conteudo) return
    navigator.clipboard?.writeText(montarTexto(conteudo, notas))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const toggleHistorico = async () => {
    if (mostrarHist) { setMostrarHist(false); return }
    setMostrarHist(true); setLoadingHist(true)
    try {
      const r = await supervisaoApi.historico(pacienteId)
      setHistorico(r.supervisoes)
    } catch { /* silencioso */ }
    finally { setLoadingHist(false) }
  }

  const abrirDoHistorico = (s: SupervisaoRegistro) => {
    setConteudo(s.conteudo)
    setSupervisaoId(s.id)
    setNotas(s.notas_psicologo || '')
    setMostrarHist(false)
  }

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch { return '' }
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="flex gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Esta análise é gerada automaticamente a partir dos registros clínicos e serve como apoio
          à preparação para supervisão. Não substitui o julgamento clínico do supervisor nem a
          supervisão profissional.
        </p>
      </div>

      {erro && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {erro}
        </div>
      )}

      {/* Estado inicial */}
      {!conteudo && !loading && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-2xl mb-4">
            <GraduationCap className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">Prepare o caso para a supervisão</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
            O sistema organiza o resumo do caso, a evolução das últimas sessões, os padrões
            identificados e sugere perguntas para você levar ao supervisor.
          </p>
          <button
            onClick={gerar}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Gerar análise para supervisão
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Organizando o caso...</p>
          <p className="text-xs text-gray-400 mt-1">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Resultado */}
      {conteudo && !loading && (
        <>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={copiarTudo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? 'Copiado' : 'Copiar tudo'}
            </button>
            <button
              onClick={gerar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nova análise
            </button>
          </div>

          {conteudo.resumo_caso && (
            <Bloco icon={ClipboardList} titulo="Resumo do caso">
              <p className="text-sm text-gray-600 leading-relaxed">{conteudo.resumo_caso}</p>
            </Bloco>
          )}

          {!!conteudo.evolucao_recente?.length && (
            <Bloco icon={TrendingUp} titulo="Evolução recente">
              <div className="space-y-3">
                {conteudo.evolucao_recente.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{e.sessao}</p>
                      <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{e.destaque}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Bloco>
          )}

          {!!conteudo.padroes?.length && (
            <Bloco icon={TrendingUp} titulo="Padrões identificados">
              <div className="space-y-3">
                {conteudo.padroes.map((p, i) => (
                  <div key={i} className="border-l-2 border-gray-100 pl-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{p.tema}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TENDENCIA_CLS[p.tendencia] || 'bg-gray-100 text-gray-600'}`}>
                        {p.tendencia}
                      </span>
                      {!!p.sessoes?.length && (
                        <span className="text-xs text-gray-400">sessões {p.sessoes.join(', ')}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">{p.observacao}</p>
                  </div>
                ))}
              </div>
            </Bloco>
          )}

          {!!conteudo.perguntas_supervisao?.length && (
            <Bloco icon={HelpCircle} titulo="Perguntas sugeridas para a supervisão">
              <ol className="space-y-2.5">
                {conteudo.perguntas_supervisao.map((q, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-xs font-semibold text-indigo-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{q}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-gray-400 mt-3">
                Sugestões — edite ou descarte conforme o que fizer sentido no seu caso.
              </p>
            </Bloco>
          )}

          {!!conteudo.pontos_atencao?.length && (
            <Bloco icon={AlertTriangle} titulo="Pontos de atenção">
              <ul className="space-y-2">
                {conteudo.pontos_atencao.map((p, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-600 leading-relaxed">{p}</p>
                  </li>
                ))}
              </ul>
            </Bloco>
          )}

          <Bloco icon={PenLine} titulo="Minhas anotações">
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              onBlur={salvarNotas}
              rows={5}
              placeholder="Dúvidas, observações e o que você quer levantar na supervisão..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-y"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Salvo automaticamente ao sair do campo.</p>
              {notasSalvas && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <Check className="w-3 h-3" /> Salvo
                </span>
              )}
            </div>
          </Bloco>
        </>
      )}

      {/* Histórico */}
      <div>
        <button
          onClick={toggleHistorico}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          Ver análises anteriores
          {mostrarHist ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {mostrarHist && (
          <div className="mt-3 bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-50">
            {loadingHist ? (
              <div className="p-4 text-center">
                <Loader2 className="w-4 h-4 text-gray-300 animate-spin mx-auto" />
              </div>
            ) : historico.length === 0 ? (
              <p className="p-4 text-xs text-gray-400 text-center">Nenhuma análise gerada ainda.</p>
            ) : (
              historico.map(s => (
                <button
                  key={s.id}
                  onClick={() => abrirDoHistorico(s)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-700">{fmt(s.created_at)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.conteudo?._total_sessoes ?? 0} sessões
                      {s.notas_psicologo ? ' · com anotações' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Abrir</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
