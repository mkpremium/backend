import { CreateNoteCommand, Note, NoteListResponse } from '../../notes/types'
import { BuildingNotesRepository } from './building-notes.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { BuildingNote } from '../building-note.entity'
import { EntityTarget } from 'typeorm'


export class PostgresBuildingNotesRepository extends WithPostgresRepository<BuildingNote> implements BuildingNotesRepository {
  async forBuildingOfId (buildingId: string): Promise<Note[]> {
    const notes = await this.repository.find({
      where: { building: { id: buildingId } },
      loadRelationIds: { relations: [ 'createdBy' ] }
    })
    return notes.map(n => ({
      buildingId,
      id: n.id,
      note: n.note,
      context: {
        buildingId: buildingId,
      },
      createdBy: n.createdBy as any as string
    }))
  }

  listNotes (query: { limit?: number, offset?: number }): Promise<NoteListResponse> {
    throw new Error('Method not implemented.')
  }

  async createNote (cmd: CreateNoteCommand, createdBy: string): Promise<Note> {
    return this.save({...cmd, createdBy })
  }

  async save (cmd: Omit<Note, 'id'> & { id?: string }): Promise<Note> {
    const savedNote = await this.repository.save({
      note: cmd.note,
      building: { id: cmd.context.buildingId },
    })

    return {
      ...cmd,
      id: savedNote.id,
      createdAt: savedNote.createdAt,
      createdBy: cmd.createdBy,
    }
  }

  protected getEntityTarget (): EntityTarget<BuildingNote> {
    return BuildingNote
  }
}
