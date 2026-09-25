import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index.js'

const DEFAULT_USER_ID = 'personal-user'
const DEFAULT_USER_EMAIL = 'personal@local'
const DEFAULT_USER_NAME = 'Personal User'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure default user always exists
    let user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } })

    if (!user) {
      user = await prisma.user.upsert({
        where: { email: DEFAULT_USER_EMAIL },
        update: {},
        create: {
          id: DEFAULT_USER_ID,
          email: DEFAULT_USER_EMAIL,
          name: DEFAULT_USER_NAME,
        },
      })
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
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
