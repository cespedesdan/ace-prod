import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase()

async function main() {
  console.log('Iniciando configuração do administrador...')

  if (!ADMIN_EMAIL) {
    throw new Error('Defina ADMIN_EMAIL para criar ou atualizar o administrador.')
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!existingAdmin && !adminPassword) {
    throw new Error('Defina ADMIN_PASSWORD para criar o usuário administrador.')
  }

  const adminUser = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: ADMIN_EMAIL,
          ...(adminPassword ? { passwordHash: await bcrypt.hash(adminPassword, 12) } : {}),
        },
      })
    : await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: 'ADMIN',
        },
      })

  await prisma.user.deleteMany({
    where: { role: 'ADMIN', id: { not: adminUser.id } },
  })

  console.log('Administrador configurado:', adminUser.email)
}

main()
  .catch((error) => {
    console.error('Erro ao configurar o administrador:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
