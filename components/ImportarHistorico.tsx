'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Camera, HelpCircle, Loader2, ChevronDown, ChevronUp, AlertTriangle, Check, Trash2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''
const token = () => typeof window !== 'undefined' ? localStorage.getItem('clinicaai_token') ?? '' : ''

type Aba = 'texto' | 'arquivo' | 'foto'

interface Sessao {
  data_estimada: string | null
  data_certeza: 'confirmada' | 'estimada' | 'desconhecida'
  tipo: string
  queixa_principal: string | null
  anamnese: string | null
  hipotese_diagnostica: string | null
  conduta: string | null
  observacoes: string | null
}

interface Preview {
  sessoes: Sessao[]
  padroes_identificados: string[]
  linha_terapeuta: string | null
  duvidas: string[]
}

interface Props {
  pacienteId: string
  pacienteNome: string
  onClose: () => void
  onConcluido: () => void
}

const TIPOS = ['consulta', 'retorno', 'anamnese', 'evolucao']

const AJUDA = `Como preparar suas anotações para importação:

📝 TEXTO DIGITADO
Cole diretamente suas anotações. Quanto mais contexto, melhor.
Inclua datas quando possível (ex: "15/03/2024 — paciente relatou...")

📄 ARQUIVO
Formatos aceitos: .txt e .pdf
Exporte suas notas do editor ou digitalize suas fichas em PDF.

📸 FOTO DE MANUSCRITO
Tire uma foto clara, com boa iluminação, sem sombras.
Letras legíveis ajudam muito na transcrição.

💡 DICA
A IA organiza em sessões separadas, identifica padrões e sinaliza
o que não ficou claro — você revisa tudo antes de salvar.`

export default function ImportarHistorico({ pacienteId, pacienteNome, onClose, onConcluido }: Props) {
  const [aba, setAba] = useState<Aba>('texto')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [imagem, setImagem] = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())
  const [salvando, setSalvando] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  const toggleExpandida = (i: number) => {
    setExpandidas(prev => {
      const novo = new Set(prev)
      novo.has(i) ? novo.delete(i) : novo.add(i)
      return novo
    })
  }

  const removerSessao = (i: number) => setSessoes(prev => prev.filter((_, idx) => idx !== i))

  const editarSessao = (i: number, campo: keyof Sessao, valor: string) => {
    setSessoes(prev => prev.map((s, idx) => idx === i ? { ...s, [campo]: valor || null } : s))
  }

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.match(/\.(txt|pdf)$/i)) { setErro('Use arquivos .txt ou .pdf'); return }
    setArquivo(f); setErro('')
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImagem(f)
    const url = URL.createObjectURL(f)
    setImagemPreview(url)
    setErro('')
  }

  const processar = async () => {
    setErro(''); setProcessando(true)
    try {
      const fd = new FormData()
      if (aba === 'texto') {
        if (!texto.trim()) { setErro('Digite ou cole as anotações.'); return }
        fd.append('texto', texto)
      } else if (aba === 'arquivo') {
        if (!arquivo) { setErro('Selecione um arquivo.'); return }
        fd.append('arquivo', arquivo)
      } else {
        if (!imagem) { setErro('Selecione uma foto.'); return }
        fd.append('imagem', imagem)
      }

      const res = await fetch(`${API}/api/v1/pacientes/${pacienteId}/importar-historico/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erro ao processar')
      }
      const data: Preview = await res.json()
      setPreview(data)
      setSessoes(data.sessoes)
      // Expandir todas por padrão
      setExpandidas(new Set(data.sessoes.map((_, i) => i)))
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar')
    } finally {
      setProcessando(false)
    }
  }

  const salvar = async () => {
    if (sessoes.length === 0) { setErro('Nenhuma sessão para salvar.'); return }
    setSalvando(true); setErro('')
    try {
      const res = await fetch(`${API}/api/v1/pacientes/${pacienteId}/importar-historico/confirmar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessoes }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      onConcluido()
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget && !processando && !salvando) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Importar histórico clínico</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pacienteNome}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAjudaAberta(v => !v)} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Como funciona">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={onClose} disabled={processando || salvando} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ajuda */}
        {ajudaAberta && (
          <div className="mx-6 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 whitespace-pre-line">
            {AJUDA}
          </div>
        )}

        <div className="px-6 py-4">

          {/* ---- Tela de entrada ---- */}
          {!preview && (
            <>
              {/* Abas */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
                {([ { id: 'texto' as Aba, label: 'Texto', Icon: FileText }, { id: 'arquivo' as Aba, label: 'Arquivo', Icon: Upload }, { id: 'foto' as Aba, label: 'Foto', Icon: Camera }]).map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => setAba(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${aba === id ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              {aba === 'texto' && (
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  rows={10}
                  placeholder={"Cole ou digite as anotações clínicas do paciente...\n\nExemplo:\n15/03/2024 — Raquel relatou dificuldades de sono. Ansiedade elevada.\nTrabalhou-se TCC, técnica de reestruturação cognitiva...\n\n22/03/2024 — Melhora parcial. Paciente identificou gatilhos..."}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              )}

              {aba === 'arquivo' && (
                <div>
                  <input ref={arquivoRef} type="file" accept=".txt,.pdf" className="hidden" onChange={handleArquivo} />
                  <button onClick={() => arquivoRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                    <Upload className="w-8 h-8" />
                    <span className="text-sm font-medium">{arquivo ? arquivo.name : 'Clique para selecionar arquivo'}</span>
                    <span className="text-xs">Formatos: .txt, .pdf</span>
                  </button>
                  {arquivo && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> {arquivo.name} selecionado</p>}
                </div>
              )}

              {aba === 'foto' && (
                <div>
                  <input ref={fotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
                  {imagemPreview ? (
                    <div className="relative">
                      <img src={imagemPreview} alt="Prévia" className="w-full rounded-xl border border-gray-200 max-h-64 object-contain" />
                      <button onClick={() => { setImagem(null); setImagemPreview(null) }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-500 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fotoRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
                      <Camera className="w-8 h-8" />
                      <span className="text-sm font-medium">Tirar foto ou selecionar imagem</span>
                      <span className="text-xs">Manuscritos, fichas, cadernos de anotações</span>
                    </button>
                  )}
                </div>
              )}

              {erro && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

              <button onClick={processar} disabled={processando}
                className="mt-5 w-full btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60">
                {processando ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando com IA...</> : '✦ Analisar anotações'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">A IA organiza as sessões — você revisa antes de salvar.</p>
            </>
          )}

          {/* ---- Tela de preview ---- */}
          {preview && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">{sessoes.length} sessão(ões) identificada(s)</h3>
                <button onClick={() => { setPreview(null); setErro('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  ← Recomeçar
                </button>
              </div>

              {/* Dúvidas da IA */}
              {preview.duvidas.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" /> Pontos para confirmar
                  </div>
                  <ul className="space-y-1">
                    {preview.duvidas.map((d, i) => (
                      <li key={i} className="text-xs text-amber-700 flex gap-1.5"><span>•</span>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sessões */}
              <div className="space-y-3">
                {sessoes.map((s, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggleExpandida(i)}>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize shrink-0">{s.tipo}</span>
                        <span className="text-sm text-gray-700 truncate">
                          {s.data_estimada
                            ? `${s.data_certeza === 'estimada' ? '~' : ''}${new Date(s.data_estimada + 'T12:00:00').toLocaleDateString('pt-BR')}`
                            : 'Data desconhecida'}
                        </span>
                        {s.data_certeza === 'estimada' && <span className="text-xs text-amber-600 shrink-0">(estimada)</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={e => { e.stopPropagation(); removerSessao(i) }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {expandidas.has(i) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {expandidas.has(i) && (
                      <div className="px-4 py-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 font-medium">Data</label>
                            <input type="date" value={s.data_estimada ?? ''}
                              onChange={e => editarSessao(i, 'data_estimada', e.target.value)}
                              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium">Tipo</label>
                            <select value={s.tipo} onChange={e => editarSessao(i, 'tipo', e.target.value)}
                              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                              {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>
                        {(['queixa_principal', 'anamnese', 'hipotese_diagnostica', 'conduta', 'observacoes'] as const).map(campo => (
                          <div key={campo}>
                            <label className="text-xs text-gray-500 font-medium capitalize">{campo.replace(/_/g, ' ')}</label>
                            <textarea rows={2} value={s[campo] ?? ''}
                              onChange={e => editarSessao(i, campo, e.target.value)}
                              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Padrões */}
              {preview.padroes_identificados.length > 0 && (
                <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-purple-700 mb-2">✦ Padrões identificados pela IA</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.padroes_identificados.map((p, i) => (
                      <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {erro && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

              <div className="mt-5 flex gap-3">
                <button onClick={onClose} disabled={salvando}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando || sessoes.length === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60">
                  {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : `Confirmar e salvar ${sessoes.length} sessão(ões)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
