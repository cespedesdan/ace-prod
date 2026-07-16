import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const configuredSecret = process.env.JWT_SECRET
if (configuredSecret && configuredSecret.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.')
}
const authGlobal = globalThis as typeof globalThis & { aceDevJwtSecret?: string }
const DUMMY_PASSWORD_HASH = '$2b$12$kRoaF5CyoRIsWytSV88FBe4MuuGy2dfnojsCYnqxH1Hy3hIEC7LMi'

function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email) throw new Error('ADMIN_EMAIL é obrigatório.')
  return email
}

function getJwtSecret() {
  if (configuredSecret) return configuredSecret
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET é obrigatório em produção.')
  authGlobal.aceDevJwtSecret ||= randomBytes(32).toString('hex')
  return authGlobal.aceDevJwtSecret
}

export interface UserPayload {
  id: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    audience: 'ace-admin',
    issuer: 'ace-produtora',
    expiresIn: '8h',
  })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      audience: 'ace-admin',
      issuer: 'ace-produtora',
    }) as UserPayload
    if (payload.role === 'ADMIN' && payload.email.toLowerCase() !== getAdminEmail()) return null
    return payload
  } catch {
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  })

  const isValidPassword = await verifyPassword(password, user?.passwordHash || DUMMY_PASSWORD_HASH)
  if (!user || !isValidPassword) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role
  }
}
