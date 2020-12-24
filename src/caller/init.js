import jwt from '../middleware/jwt'
import { Router } from 'express'

export const initCallerModule = (app) => {
  const secured = jwt()

  app.use('/caller',
    secured,
    createRouter()
  )
}

const createRouter = () => {
  const router = new Router()

  router.post('/next-worksheet', (req, res) => {
    res.sendStatus(501)
  })

  return router
}
