'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type IntentLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & { href: string }

export function IntentLink({ href, onClick, onFocus, onMouseEnter, onTouchStart, ...props }: IntentLinkProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, setPending] = useState(false)
  const prefetch = () => router.prefetch(href)

  useEffect(() => setPending(false), [pathname])

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      aria-busy={pending || undefined}
      data-navigation-pending={pending || undefined}
      onClick={(event) => {
        onClick?.(event)
        const opensCurrentTab = event.button === 0
          && !event.metaKey
          && !event.ctrlKey
          && !event.shiftKey
          && !event.altKey
          && event.currentTarget.target !== '_blank'
          && !event.currentTarget.hasAttribute('download')

        if (!event.defaultPrevented && opensCurrentTab && pathname !== href) setPending(true)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        prefetch()
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        prefetch()
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event)
        prefetch()
      }}
    />
  )
}
