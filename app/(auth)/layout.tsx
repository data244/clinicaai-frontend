export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const Logo = (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Painel da visão (desktop) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 p-12 text-white">
        {/* Foto de fundo (coloque Frontend/public/login-bg.jpg). Some se o arquivo não existir. */}
        <img src="/login-bg.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800/90 via-primary-700/85 to-indigo-800/90" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">{Logo}</div>
          <div>
            <p className="font-bold text-lg leading-none">Clínica.ai</p>
            <p className="text-xs text-white/70 mt-1">Inteligência clínica longitudinal</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Do registro ao que vem a seguir.</h2>
          <p className="mt-4 text-white/80 leading-relaxed">
            Cada atendimento vira dado. A inteligência longitudinal revela padrões e antecipa
            tendências — para você cuidar da causa, não só do sintoma.
          </p>

          {/* Gráfico: passado (sólido) -> hoje -> predição (tracejado, subindo) */}
          <svg viewBox="0 0 400 130" className="w-full mt-8" fill="none">
            <line x1="200" y1="10" x2="200" y2="120" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="200" y="128" fill="white" fillOpacity="0.6" fontSize="10" textAnchor="middle">hoje</text>
            <polyline points="0,80 35,80 50,55 65,95 80,80 130,80 150,60 170,80 200,72"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {[35,80,130,170].map((x,i)=>(<circle key={i} cx={x} cy={80} r="3.5" fill="white" />))}
            <polyline points="200,72 250,60 300,44 350,30 392,18"
              stroke="white" strokeOpacity="0.85" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="392" cy="18" r="5" fill="white" />
            <circle cx="392" cy="18" r="11" fill="white" fillOpacity="0.18" />
          </svg>

          <ul className="mt-8 space-y-2 text-sm text-white/85">
            <li className="flex gap-2"><span className="text-white/50">›</span> Histórico que se constrói sozinho a cada sessão</li>
            <li className="flex gap-2"><span className="text-white/50">›</span> Padrões e alertas que emergem do conjunto</li>
            <li className="flex gap-2"><span className="text-white/50">›</span> Uma leitura que aponta para frente, não só para trás</li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">Cuidado guiado por inteligência · da Ciência da Informação à prática clínica</p>
      </div>

      {/* Painel do formulário */}
      <div className="flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 min-h-screen lg:min-h-0 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">{Logo}</div>
            <h1 className="text-2xl font-bold text-gray-900">Clínica.ai</h1>
            <p className="text-sm text-gray-500 mt-1">Inteligência clínica longitudinal</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
