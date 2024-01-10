import { wrap } from 'express-promise-wrap'
import { BuildingNotesRepository } from '../building/repository/building-notes.repository'
import { History } from '../history/models'

export function listNotesControllerFactory ({ buildingNotesRepository }: {
  buildingNotesRepository: BuildingNotesRepository
}) {
  return wrap(async function listNotes (req, res) {
      const result = await buildingNotesRepository.listNotes(req.query)
      res.json(result)
    }
  )
}

export function addNoteControllerFactory  ({ buildingNotesRepository }: {
  buildingNotesRepository: BuildingNotesRepository
}) {
  return wrap(async function listNotes (req, res) {
    const note = await buildingNotesRepository.createNote(req.body, req.user.id)

    await History.registerCreate({ contextModel: note, user: req.user })
    res.status(201).json(note)
    }
  )
}
