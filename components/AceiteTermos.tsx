// Caixa de aceite dos Termos de Uso e da Política de Privacidade (cadastro, convite beta e assinar).
// Os links abrem em outra aba para a pessoa não perder o que já preencheu.
export default function AceiteTermos({ marcado, onChange, escuro = false }: {
  marcado: boolean
  onChange: (marcado: boolean) => void
  escuro?: boolean
}) {
  const link = escuro ? 'text-indigo-400 hover:text-indigo-300 underline' : 'text-primary-600 hover:underline'
  return (
    <label className={`flex items-start gap-2 text-xs leading-relaxed cursor-pointer ${escuro ? 'text-gray-400' : 'text-gray-600'}`}>
      <input
        type="checkbox" checked={marcado} onChange={e => onChange(e.target.checked)}
        className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer ${escuro ? 'accent-indigo-500' : 'accent-primary-600'}`}
      />
      <span>
        Li e aceito os{' '}
        <a href="/termos" target="_blank" rel="noopener noreferrer" className={link}>Termos de Uso</a>
        {' '}e a{' '}
        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className={link}>Política de Privacidade</a>.
      </span>
    </label>
  )
}
