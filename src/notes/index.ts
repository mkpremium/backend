import { Router } from 'express'
import { addNoteControllerFactory, listNotesControllerFactory } from './controllers'

import './types'
import { asFunction, AwilixContainer } from 'awilix'

export default (app, diContainer: AwilixContainer, secured) => {
  diContainer.register({
    addNoteController: asFunction(addNoteControllerFactory),
    listNotesController: asFunction(listNotesControllerFactory)
  })

  const router = Router()

  router.get('/', diContainer.resolve('listNotesController') as ReturnType<typeof listNotesControllerFactory>)

  router.post('/', diContainer.resolve('addNoteController') as ReturnType<typeof addNoteControllerFactory>)

  app.use('/notes', secured, router)
}
