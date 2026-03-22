import { getPlanColor } from '@/lib/utils'

export default function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase tracking-wide ${getPlanColor(plan)}`}>
      {plan}
    </span>
  )
}