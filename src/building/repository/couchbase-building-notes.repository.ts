import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { CreateNoteCommand, Note, NoteBody, NoteListQuery, NoteListResponse, TNote } from '../../notes/types'
import { BuildingNotesRepository } from './building-notes.repository'

const notesForBuildingQuery = bucketName => `
    SELECT notes
    FROM ${bucketName} notes
    WHERE _documentType = 'note'
      AND context.buildingId = $1
`

export class CouchbaseBuildingNotesRepository extends CouchbaseRepository<Note> implements BuildingNotesRepository {
  forBuildingOfId (buildingId: string): Promise<Note[]> {
    return this.couchbaseAdapter.queryAsync(
      notesForBuildingQuery(this.bucketName), [ buildingId ]
    ).then(notes => {
      try {
        return fromJSON(notes.map(({ notes }) => notes), t.list(TNote))
      } catch (error) {
        console.log({ notes, error })
        return notes
      }
    })
  }

  async listNotes (query: { context: string }): Promise<NoteListResponse> {
    const { buildingId } = JSON.parse(query.context)

    return fromJSON({ results: await this.forBuildingOfId(buildingId) }, NoteListResponse)
  }

  createNote (params: CreateNoteCommand, createdBy: string) {
    const noteBody = NoteBody(params)
    return this.save(t.update(noteBody, { $merge: { createdBy } }))
  }


  struct () {
    return TNote
  }
}
