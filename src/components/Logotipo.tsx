import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'brand' | 'neutral'
  priority?: boolean
}

export function Logotipo({ className, size = 'md', variant = 'neutral', priority = false }: LogoProps) {
  const sizeClasses = {
    sm: 'w-16 aspect-[1339/557]',
    md: 'w-24 aspect-[1339/557]',
    lg: 'w-32 aspect-[1339/557]'
  }
  const imageSizes = { sm: '64px', md: '96px', lg: '128px' }[size]

  return (
    <div className={cn('relative', sizeClasses[size], variant === 'neutral' && 'brand-logo-neutral', className)}>
      <Image
        src="/aceprodutora_logotipo.png"
        alt="Ace Produtora"
        width={1339}
        height={557}
        sizes={imageSizes}
        quality={70}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  )
}
