import { wrap } from 'express-promise-wrap'
import { BuildingNotesRepository } from '../building/repository/building-notes.repository'
import { NoteRepository } from './models'
import { History } from '../history/models'

export function listNotesController ({ buildingNotesRepository }: {
  buildingNotesRepository: BuildingNotesRepository
}) {
  return wrap(async function listNotes (req, res) {
      const result = await buildingNotesRepository.listNotes(req.query)
      res.json(result)
    }
  )
}

export async function addNote (req, res) {
  const repo = new NoteRepository()
  const note = await repo.createNote(req.body, req.user.id)

  await History.registerCreate({ contextModel: note, user: req.user })
  res.status(201).json(note)
}

export const addNoteController = wrap(addNote)
