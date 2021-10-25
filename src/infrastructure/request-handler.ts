import { Request, Response } from 'express-serve-static-core'

export type RequestHandler = (req: Request, res: Response) => Promise<void>
