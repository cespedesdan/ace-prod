import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'brand' | 'neutral'
}

export function Logo({ className, size = 'md', variant = 'neutral' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={cn('relative', sizeClasses[size], variant === 'neutral' && 'brand-logo-neutral', className)}>
      <Image
        src="/copa_ace_logo_clean.png"
        alt="Copa Ace Logo"
        width={1024}
        height={1024}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
