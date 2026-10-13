import { Plus } from 'lucide-react'
import { faq, type House } from '../data/site'

export function Faq({ house }: { house: House }) {
  return (
    <div className="faq">
      {faq.filter(f => !f.house || f.house === house.slug).map((f) => (
        <details key={f.q}>
          <summary>
            {f.q}
            <Plus size={20} />
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}
