import type { Metadata } from 'next'
import RegistrationClosed from '@/components/RegistrationClosed'

export const metadata: Metadata = {
  title: 'Inscrições encerradas — Copa Ace 10 | Ace Produtora',
  description: 'Informações da décima edição da Copa Ace após o encerramento das inscrições.',
}

export default function RegistrationPage() {
  return <RegistrationClosed />
}
