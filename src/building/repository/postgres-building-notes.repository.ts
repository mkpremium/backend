import { CreateNoteCommand, Note, NoteListResponse } from '../../notes/types'
import { BuildingNotesRepository } from './building-notes.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { BuildingNote } from '../building-note.entity'
import { EntityTarget } from 'typeorm'

export class PostgresBuildingNotesRepository extends WithPostgresRepository<BuildingNote> implements BuildingNotesRepository {
  async forBuildingOfId (buildingId: string): Promise<Note[]> {
    const notes = await this.repository.find({
      where: { building: { id: buildingId } },
      loadRelationIds: { relations: ['author'] },
      order: { createdAt: 'DESC' }
    })
    return notes.map(n => ({
      buildingId,
      id: n.id,
      note: n.note,
      context: {
        buildingId
      },
      createdBy: n.author as any as string
    }))
  }

  async listNotes (buildingId: string): Promise<NoteListResponse> {
    return { results: await this.forBuildingOfId(buildingId) }
  }

  async createNote (cmd: CreateNoteCommand, createdBy: string): Promise<Note> {
    return this.save({ ...cmd, createdBy })
  }

  async save (cmd: Omit<Note, 'id'> & { id?: string }): Promise<Note> {
    const savedNote = await this.repository.save({
      note: cmd.note,
      building: { id: cmd.context.buildingId },
      author: { id: cmd.createdBy }
    })

    return {
      ...cmd,
      id: savedNote.id,
      createdAt: savedNote.createdAt,
      createdBy: cmd.createdBy
    }
  }

  protected getEntityTarget (): EntityTarget<BuildingNote> {
    return BuildingNote
  }
}
