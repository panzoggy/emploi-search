import { cn } from '../shared/lib/cn'
import type { MatchReason, Verdict } from './types'

// Une marque typographique par verdict, comme dans un registre. Vert et rouge gardent leur sens.
const MARKS: Record<Verdict, { mark: string; tone: string; label: string }> = {
  ok: { mark: '+', tone: 'text-success', label: 'Correspond' },
  partial: { mark: '±', tone: 'text-fg-2', label: 'En partie' },
  ko: { mark: '−', tone: 'text-danger', label: 'Ne correspond pas' },
  unknown: { mark: '?', tone: 'text-fg-3', label: 'Information absente' },
}

export function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {reasons.map(reason => {
          const { mark, tone, label } = MARKS[reason.verdict]
          return (
            <tr key={reason.key} className="border-b border-rule-subtle last:border-b-0">
              <td className={cn('w-6 py-2 align-top font-mono', tone)} aria-label={label}>
                {mark}
              </td>
              <th scope="row" className="w-32 py-2 pr-4 text-left align-top font-normal text-fg">
                {reason.label}
              </th>
              <td className="py-2 align-top text-fg-2">{reason.detail}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
