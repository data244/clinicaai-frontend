'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

export default function InfoTip({ text, title }: { text: string; title?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label="Ajuda"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 top-7 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed text-left font-normal"
        >
          {title && <span className="block font-semibold mb-0.5">{title}</span>}
          {text}
        </span>
      )}
    </span>
  )
}
