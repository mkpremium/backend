import { PrismaClient } from '@prisma/client'

export function getClient () {
  return new PrismaClient()
}
