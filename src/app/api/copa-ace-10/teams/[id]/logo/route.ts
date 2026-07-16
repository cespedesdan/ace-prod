import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.registration.findFirst({
    where: {
      id,
      tournament: 'Copa Ace 10',
      status: 'APPROVED',
    },
    select: { logoPath: true },
  })

  if (!registration) {
    return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
  }

  const storageRoot = path.resolve(process.cwd(), 'storage', 'registrations')
  const filePath = path.resolve(storageRoot, registration.logoPath)
  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
  }

  try {
    const file = await readFile(filePath)
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Logo não encontrada' }, { status: 404 })
  }
}
