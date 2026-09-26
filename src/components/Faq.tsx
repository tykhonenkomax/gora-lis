import { Plus } from 'lucide-react'
import { faq } from '../data/site'

export function Faq() {
  return (
    <div className="faq">
      {faq.map((f) => (
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
