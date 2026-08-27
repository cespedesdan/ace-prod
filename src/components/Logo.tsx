import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'brand' | 'neutral'
  priority?: boolean
  sizes?: string
}

export function Logo({ className, size = 'md', variant = 'neutral', priority = false, sizes }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  const imageSizes = sizes ?? { sm: '32px', md: '48px', lg: '64px' }[size]

  return (
    <div className={cn('relative', sizeClasses[size], variant === 'neutral' && 'brand-logo-neutral', className)}>
      <Image
        src="/copa_ace_logo_clean.png"
        alt="Copa Ace Logo"
        width={1024}
        height={1024}
        sizes={imageSizes}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  )
}
