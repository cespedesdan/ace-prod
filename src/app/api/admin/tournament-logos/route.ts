import { randomUUID } from 'node:crypto'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { adminCookieName, requireSameOrigin } from '@/lib/admin-request'
import { verifyToken } from '@/lib/auth'
import { MAX_REGISTRATION_FILE_SIZE } from '@/lib/registration-shared'
import { normalizeRegistrationImage, NormalizedImageTooLargeError } from '@/lib/registration-upload'
import { readFormDataWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'
import { privateJson } from '@/lib/private-response'

export const runtime = 'nodejs'

const directory = path.join(process.cwd(), 'public', 'hall-of-fame', 'logos')
const publicDirectory = '/hall-of-fame/logos/'
const imageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function isAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookieName())?.value
  return token ? verifyToken(token)?.role === 'ADMIN' : false
}

function validSignature(buffer: Buffer, extension: string) {
  if (extension === 'jpg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
}

async function logos() {
  await mkdir(directory, { recursive: true })
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name))
    .map((entry) => `${publicDirectory}${entry.name}`)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return privateJson({ error: 'Acesso negado' }, { status: 401 })
  return privateJson({ logos: await logos() })
}

export async function POST(request: NextRequest) {
  const invalidOrigin = requireSameOrigin(request)
  if (invalidOrigin) return invalidOrigin
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

  try {
    const formData = await readFormDataWithLimit(request, MAX_REGISTRATION_FILE_SIZE + 1024 * 1024)
    const file = formData.get('logo')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Selecione uma imagem.' }, { status: 400 })
    }
    if (file.size > MAX_REGISTRATION_FILE_SIZE) {
      return NextResponse.json({ error: 'A logo deve ter no máximo 10 MB.' }, { status: 413 })
    }

    const extension = imageTypes[file.type]
    if (!extension) return NextResponse.json({ error: 'Envie uma imagem PNG, JPG ou WEBP.' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validSignature(buffer, extension)) {
      return NextResponse.json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' }, { status: 400 })
    }

    let normalized: Buffer
    try {
      normalized = await normalizeRegistrationImage(buffer, extension)
    } catch (error) {
      if (error instanceof NormalizedImageTooLargeError) {
        return NextResponse.json({ error: 'A logo deve ter no máximo 10 MB após o processamento.' }, { status: 413 })
      }
      return NextResponse.json({ error: 'A imagem enviada é inválida ou não pôde ser processada.' }, { status: 400 })
    }
    await mkdir(directory, { recursive: true })
    const filename = `campeonato-${randomUUID()}.${extension}`
    await writeFile(path.join(directory, filename), normalized, { flag: 'wx' })
    return NextResponse.json({ logoUrl: `${publicDirectory}${filename}` }, { status: 201 })
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A logo deve ter no máximo 10 MB.' }, { status: 413 })
    }
    console.error('Tournament logo upload error:', error)
    return NextResponse.json({ error: 'Não foi possível enviar a logo.' }, { status: 500 })
  }
}
