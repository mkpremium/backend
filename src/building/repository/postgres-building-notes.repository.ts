import { CreateNoteCommand, Note, NoteListResponse } from '../../notes/types'
import { BuildingNotesRepository } from './building-notes.repository'


export class PostgresBuildingNotesRepository implements BuildingNotesRepository {
  forBuildingOfId (buildingId: string): Promise<Note[]> {
    throw new Error('Method not implemented.')
  }

  listNotes (query: { limit?: number; offset?: number }): Promise<NoteListResponse> {
    throw new Error('Method not implemented.')
  }

  createNote (params: CreateNoteCommand, createdBy: string): Promise<Note> {
    throw new Error('Method not implemented.')
  }
}
