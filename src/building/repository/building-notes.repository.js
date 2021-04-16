import { CouchbaseRepository } from '../../db/couchbase.repository'
import { TNote } from '../../notes/types'
import { N1qlQuery } from 'couchbase'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'

const notesForBuildingQuery = bucketName => `
    SELECT notes
    FROM ${bucketName} notes
    WHERE _documentType = 'note' AND context.buildingId = $1
`

export class BuildingNotesRepository extends CouchbaseRepository {
  forBuildingOfId (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(notesForBuildingQuery(this.bucketName)), [ buildingId ]
    ).then(notes => {
      try {
        return fromJSON(notes.map(({ notes }) => notes), t.list(TNote))
      } catch (error) {
        console.log({ notes, error })
        return notes
      }
    })
  }

  struct () {
    return TNote
  }
}
