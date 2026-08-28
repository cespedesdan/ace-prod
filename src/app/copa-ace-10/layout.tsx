import './copa-theme.css'
import { ClientPerformance } from '@/components/ClientPerformance'

export default function CopaAce10Layout({ children }: { children: React.ReactNode }) {
  return <><ClientPerformance />{children}<noscript><style>{'@import url("/copa-ace-10/deferred-v1.css");'}</style></noscript></>
}
