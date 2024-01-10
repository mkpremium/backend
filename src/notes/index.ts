import { Router } from 'express'
import { addNoteController, listNotesController } from './controllers'

import './types'
import { asFunction, AwilixContainer } from 'awilix'

export default (app, diContainer: AwilixContainer, secured) => {
  diContainer.register('listNotesController', asFunction(listNotesController))

  const router = Router()

  router.get('/', diContainer.resolve('listNotesController') as ReturnType<typeof listNotesController>)

  router.post('/', addNoteController)

  app.use('/notes', secured, router)
}
