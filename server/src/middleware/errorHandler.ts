import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message })
    return
  }
  if ((err as any).code === 'ER_DUP_ENTRY') {
    res.status(409).json({ success: false, error: 'Record already exists' })
    return
  }
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<void>) {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}