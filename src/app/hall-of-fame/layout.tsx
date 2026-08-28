import './hall.css'
import { ClientPerformance } from '@/components/ClientPerformance'

export default function HallOfFameLayout({ children }: { children: React.ReactNode }) {
  return <><ClientPerformance />{children}</>
}
