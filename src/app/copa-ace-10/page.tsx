import type { Metadata } from 'next'
import CopaAce10Page from '@/components/CopaAce10Page'

export const revalidate = 60

export const metadata: Metadata = {
  alternates: { canonical: '/copa-ace-10' },
  title: 'Copa Ace 10 | Ace Produtora',
  description: 'Página oficial da Copa Ace 10: 16 equipes, fase suíça MD1 e playoffs MD3.',
}

export default function CopaAce10Route() {
  return <CopaAce10Page />
}
