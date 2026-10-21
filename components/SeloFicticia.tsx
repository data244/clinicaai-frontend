// A Raquel e qualquer paciente marcada como fictícia (pacientes.ficticia) leva este selo

export default function SeloFicticia({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}>
      Paciente fictícia
    </span>
  )
}

/** Nome para listas de escolha (select), onde não cabe o selo. */
export function rotuloPaciente(p: { nome: string; ficticia?: boolean }) {
  return p.ficticia ? `${p.nome} (paciente fictícia)` : p.nome
}
