import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FaceitApiError, getFaceitTeam } from '@/lib/faceit'
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit'
import { MAX_REGISTRATION_FILE_SIZE } from '@/lib/registration-shared'
import { registrationsAreOpen } from '@/lib/registration-status'
import { readFormDataWithLimit, RequestBodyTooLargeError } from '@/lib/request-body'

export const runtime = 'nodejs'

const logoMimeTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const proofMimeTypes: Record<string, string> = {
  ...logoMimeTypes,
  'application/pdf': 'pdf',
}

const REGISTRATION_RATE_LIMIT = { limit: 3, windowMs: 24 * 60 * 60_000, blockMs: 24 * 60 * 60_000 }
const MAX_REQUEST_SIZE = 22 * 1024 * 1024

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().replace(/\s+/g, ' ')
    : ''
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

function hasValidSignature(buffer: Buffer, extension: string) {
  if (extension === 'jpg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (extension === 'webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  if (extension === 'pdf') return buffer.subarray(0, 1024).indexOf('%PDF-') >= 0
  return false
}

async function validateUpload(value: FormDataEntryValue | null, allowedTypes: Record<string, string>, label: string) {
  if (!(value instanceof File) || value.size === 0) {
    return `${label} é obrigatório.`
  }
  if (value.size > MAX_REGISTRATION_FILE_SIZE) {
    return `${label} deve ter no máximo 10 MB.`
  }
  const extension = allowedTypes[value.type]
  if (!extension) {
    return `Formato inválido para ${label.toLowerCase()}.`
  }
  const buffer = Buffer.from(await value.arrayBuffer())
  if (!hasValidSignature(buffer, extension)) {
    return `O conteúdo de ${label.toLowerCase()} não corresponde ao formato informado.`
  }
  return { file: value, extension, buffer }
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: 'Limite de três tentativas atingido. Tente novamente em 24 horas.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}

export async function POST(request: NextRequest) {
  if (!registrationsAreOpen()) {
    return errorResponse('As inscrições estão encerradas.', 410)
  }

  let registrationDirectory = ''

  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Envie os dados pelo formulário de inscrição.')
    }
    const clientIp = getClientIp(request)
    if (clientIp) {
      const ipLimit = await consumeRateLimit({
        scope: 'registration-ip',
        identifier: clientIp,
        ...REGISTRATION_RATE_LIMIT,
      })
      if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSeconds)
    }

    let formData: FormData
    try {
      formData = await readFormDataWithLimit(request, MAX_REQUEST_SIZE)
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return errorResponse('O envio ultrapassa o limite permitido.', 413)
      }
      return errorResponse('Os dados enviados pelo formulário são inválidos.')
    }
    const submittedFaceitUrl = readText(formData, 'teamFaceitUrl')
    const teamTag = readText(formData, 'teamTag').toUpperCase()
    const representativeName = readText(formData, 'representativeName')
    const representativeEmail = readText(formData, 'representativeEmail').toLowerCase()
    const representativePhone = readText(formData, 'representativePhone')
    const teamInstagram = readText(formData, 'teamInstagram')
    const discoverySource = readText(formData, 'discoverySource') || 'Não informado'
    const scheduleRestrictions = readText(formData, 'scheduleRestrictions')

    const emailLimit = await consumeRateLimit({
      scope: 'registration-email',
      identifier: representativeEmail || 'invalid-email',
      ...REGISTRATION_RATE_LIMIT,
    })
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSeconds)

    let faceitTeam
    try {
      faceitTeam = await getFaceitTeam(submittedFaceitUrl)
    } catch (error) {
      if (error instanceof FaceitApiError) return errorResponse(error.message, error.status)
      throw error
    }
    const teamFaceitUrl = faceitTeam.faceitUrl
    const teamName = faceitTeam.name
    const teamNameNormalized = teamName.toLocaleLowerCase('pt-BR')
    if (teamName.length < 2 || teamName.length > 80) {
      return errorResponse('O nome do time retornado pela FACEIT é inválido.')
    }
    if (faceitTeam.members.length < 5) {
      return errorResponse('O time precisa ter pelo menos cinco membros na FACEIT.')
    }
    if (teamTag.length < 2 || teamTag.length > 10) {
      return errorResponse('A sigla deve ter entre 2 e 10 caracteres.')
    }
    if (representativeName.length < 5 || representativeName.length > 120) {
      return errorResponse('Informe o nome completo do representante.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representativeEmail)) {
      return errorResponse('Informe um e-mail válido.')
    }
    const phoneDigits = representativePhone.replace(/\D/g, '')
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return errorResponse('Informe um telefone ou WhatsApp válido.')
    }
    if (teamInstagram.length > 100) {
      return errorResponse('O Instagram da equipe deve ter no máximo 100 caracteres.')
    }
    if (scheduleRestrictions.length > 500) {
      return errorResponse('As restrições de horário devem ter no máximo 500 caracteres.')
    }
    if (readText(formData, 'consent') !== 'accepted') {
      return errorResponse('É necessário aceitar o regulamento e confirmar os dados.')
    }

    const logoUpload = await validateUpload(formData.get('teamLogo'), logoMimeTypes, 'A logo da equipe')
    if (typeof logoUpload === 'string') return errorResponse(logoUpload)

    const proofUpload = await validateUpload(formData.get('paymentProof'), proofMimeTypes, 'O comprovante de pagamento')
    if (typeof proofUpload === 'string') return errorResponse(proofUpload)

    const existingTeam = await prisma.registration.findFirst({
      where: {
        tournament: 'Copa Ace 10',
        OR: [{ teamNameNormalized }, { faceitTeamId: faceitTeam.teamId }],
      },
      select: { id: true },
    })
    if (existingTeam) {
      return errorResponse('Já existe uma inscrição para esta equipe.', 409)
    }

    const id = randomUUID()
    const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '')
    const protocol = `ACE10-${datePart}-${randomBytes(3).toString('hex').toUpperCase()}`
    const storageRoot = path.join(process.cwd(), 'storage', 'registrations')
    registrationDirectory = path.join(storageRoot, id)
    await mkdir(registrationDirectory, { recursive: true })

    const logoRelativePath = path.join(id, `team-logo.${logoUpload.extension}`)
    const proofRelativePath = path.join(id, `payment-proof.${proofUpload.extension}`)
    await Promise.all([
      writeFile(path.join(storageRoot, logoRelativePath), logoUpload.buffer),
      writeFile(path.join(storageRoot, proofRelativePath), proofUpload.buffer),
    ])

    await prisma.registration.create({
      data: {
        id,
        protocol,
        teamFaceitUrl,
        faceitTeamId: faceitTeam.teamId,
        faceitTeamNickname: faceitTeam.nickname,
        faceitTeamAvatarUrl: faceitTeam.avatarUrl,
        faceitLastSyncedAt: new Date(),
        teamName,
        teamNameNormalized,
        teamTag,
        representativeName,
        representativeEmail,
        representativePhone,
        teamInstagram: teamInstagram || null,
        discoverySource,
        scheduleRestrictions: scheduleRestrictions || null,
        rulesAccepted: true,
        logoPath: logoRelativePath,
        logoOriginalName: logoUpload.file.name,
        paymentProofPath: proofRelativePath,
        paymentProofOriginalName: proofUpload.file.name,
        players: {
          create: faceitTeam.members.map((member) => ({
            faceitPlayerId: member.playerId,
            nickname: member.nickname,
            avatarUrl: member.avatarUrl,
            country: member.country,
            skillLevel: member.skillLevel,
            membershipType: member.membershipType,
            isLeader: member.isLeader,
            faceitUrl: member.faceitUrl,
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      protocol,
      message: 'Inscrição enviada com sucesso.',
    })
  } catch (error) {
    if (registrationDirectory) {
      await rm(registrationDirectory, { recursive: true, force: true }).catch(() => undefined)
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorResponse('Já existe uma inscrição para esta equipe.', 409)
    }
    console.error('Registration error:', error)
    return errorResponse('Não foi possível concluir a inscrição. Tente novamente.', 500)
  }
}
