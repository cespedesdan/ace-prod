import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'brand' | 'neutral'
}

export function Logotipo({ className, size = 'md', variant = 'neutral' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-16 aspect-[1339/557]',
    md: 'w-24 aspect-[1339/557]',
    lg: 'w-32 aspect-[1339/557]'
  }

  return (
    <div className={cn('relative', sizeClasses[size], variant === 'neutral' && 'brand-logo-neutral', className)}>
      <Image
        src="/aceprodutora_logotipo.png"
        alt="Ace Produtora"
        width={1339}
        height={557}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
