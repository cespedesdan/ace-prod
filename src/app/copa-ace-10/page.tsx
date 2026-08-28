import type { Metadata } from 'next'
import CopaAce10Page from '@/components/CopaAce10Page'
import './copa-ace-10.css'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Copa Ace 10 | Ace Produtora',
  description: 'Página oficial da Copa Ace 10: 16 equipes, fase suíça MD1 e playoffs MD3.',
}

export default function CopaAce10Route() {
  return <CopaAce10Page />
}
