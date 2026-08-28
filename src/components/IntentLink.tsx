import type { ComponentProps } from 'react'
import Link from 'next/link'

type IntentLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & { href: string }

export function IntentLink({ href, ...props }: IntentLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      data-intent-prefetch=""
    />
  )
}
