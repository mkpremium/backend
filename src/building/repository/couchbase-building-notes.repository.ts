import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { CreateNoteCommand, Note, NoteBody, NoteListQuery, NoteListResponse, TNote } from '../../notes/types'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../../lib/query/helpers'
import { createQueryBuilder } from '../../db/model'
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

  async listNotes (query = {}): Promise<NoteListResponse> {
    const params = fromJSON(query, NoteListQuery)
    const qb = createQueryBuilder(this.struct().meta.props, 'note')
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = createQueryBuilder(this.struct().meta.props, 'note', 'count')

    if (params.createdBy) {
      qb.where('createdBy = ?', params.createdBy)
      qbCount.where('createdBy = ?', params.createdBy)
    }

    if (params.createdAt) {
      addDateQueryToBuilder(qb, 'createdAt', params.createdAt)
      addDateQueryToBuilder(qbCount, 'createdAt', params.createdAt)
    } else if (params.createdBetween) {
      addBetweenQueryToBuilder(qb, 'createdBetween', params.createdBetween)
      addBetweenQueryToBuilder(qbCount, 'createdBetween', params.createdBetween)
    }

    if (params.context) {
      const context = JSON.parse(params.context)
      Object.keys(context).forEach(key => {
        qb.where(`context.${key} = ?`, context[ key ])
        qbCount.where(`context.${key} = ?`, context[ key ])
      })
    }

    const qbCountParams = qbCount.toParam()
    const [ { count } ] = await this.couchbaseAdapter.queryAsync(qbCountParams.text, qbCountParams.values)
    const total = count
    qb.order('createdAt', false)
    const results = await this.couchbaseAdapter.queryAsync(qb)

    return fromJSON({ total, results }, NoteListResponse)
  }

  createNote (params: CreateNoteCommand, createdBy: string) {
    const noteBody = NoteBody(params)
    return this.save(t.update(noteBody, { $merge: { createdBy } }))
  }


  struct () {
    return TNote
  }
}
