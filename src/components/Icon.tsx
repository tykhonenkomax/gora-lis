import {
  Bath,
  Bed,
  Check,
  Flame,
  Tent,
  Thermometer,
  Trees,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  bath: Bath,
  bed: Bed,
  flame: Flame,
  tent: Tent,
  thermometer: Thermometer,
  trees: Trees,
  users: Users,
  wifi: Wifi,
  zap: Zap,
}

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[name] ?? Check
  return <Cmp {...props} />
}
