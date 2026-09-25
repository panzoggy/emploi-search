import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index.js'

const DEFAULT_USER_ID = 'personal-user'
const DEFAULT_USER_EMAIL = 'personal@local'
const DEFAULT_USER_NAME = 'Personal User'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID
  
  let user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    user = await prisma.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: { id: userId },
      create: {
        id: userId,
        email: DEFAULT_USER_EMAIL,
        name: DEFAULT_USER_NAME,
      },
    })
  }
  
  req.user = user
  next()
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        email: string
        name: string | null
      }
    }
  }
}