import type { Metadata } from 'next'
import RegistrationForm from '@/components/RegistrationForm'

export const metadata: Metadata = {
  title: 'Inscreva-se na Copa Ace 10 | Ace Produtora',
  description: 'Inscrição oficial de equipes para a décima edição da Copa Ace.',
}

export default function RegistrationPage() {
  return <RegistrationForm />
}
