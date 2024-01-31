import { wrap } from 'express-promise-wrap'
import { BuildingNotesRepository } from '../building/repository/building-notes.repository'

export function listNotesControllerFactory ({ buildingNotesRepository }: {
  buildingNotesRepository: BuildingNotesRepository
}) {
  return wrap(async function listNotes (req, res) {
    const { buildingId } = JSON.parse(req.query.context)
    const result = await buildingNotesRepository.listNotes(buildingId)
    res.json(result)
  }
  )
}

export function addNoteControllerFactory ({ buildingNotesRepository }: {
  buildingNotesRepository: BuildingNotesRepository
}) {
  return wrap(async function listNotes (req, res) {
    const note = await buildingNotesRepository.createNote(req.body, req.user.id)

    res.status(201).json(note)
  }
  )
}
