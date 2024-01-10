import { CreateNoteCommand, Note, NoteListResponse } from '../../notes/types'


export interface BuildingNotesRepository {
  forBuildingOfId (buildingId: string): Promise<Note[]>

  listNotes (query: { limit?: number, offset?: number }): Promise<NoteListResponse>

  createNote (params: CreateNoteCommand, createdBy: string): Promise<Note>

  save (note: Omit<Note, 'id'> & { id?: string }): Promise<Note>
}
