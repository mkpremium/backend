import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Note, NoteListQuery, NoteListResponse, TNote } from '../../notes/types'
import { addBetweenQueryToBuilder, addDateQueryToBuilder } from '../../lib/query/helpers'
import { createQueryBuilder } from '../../db/model'

const notesForBuildingQuery = bucketName => `
    SELECT notes
    FROM ${bucketName} notes
    WHERE _documentType = 'note' AND context.buildingId = $1
`

export class BuildingNotesRepository extends CouchbaseRepository<Note> {
  forBuildingOfId (buildingId) {
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

  async listNotes (query = {}) {
    const params = fromJSON(query, NoteListQuery)
    const qb = createQueryBuilder(this.struct().meta.props)
      .limit(params.limit)
      .offset(params.offset)
    const qbCount = createQueryBuilder(this.struct().meta.props, 'count')

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


  struct () {
    return TNote
  }
}
