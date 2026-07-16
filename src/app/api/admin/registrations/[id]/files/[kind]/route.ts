import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; kind: string }> }) {
  const token = request.cookies.get('admin-token')?.value
  const payload = token ? verifyToken(token) : null
  if (payload?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  const { id, kind } = await context.params
  if (kind !== 'logo' && kind !== 'payment') {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  const registration = await prisma.registration.findUnique({ where: { id } })
  if (!registration) {
    return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
  }

  const relativePath = kind === 'logo' ? registration.logoPath : registration.paymentProofPath
  const originalName = kind === 'logo' ? registration.logoOriginalName : registration.paymentProofOriginalName
  const storageRoot = path.resolve(process.cwd(), 'storage', 'registrations')
  const filePath = path.resolve(storageRoot, relativePath)
  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
  }

  try {
    const file = await readFile(filePath)
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }
}
