import { Request, Response, NextFunction } from 'express'
import { prisma } from '../index.js'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
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