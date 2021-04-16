import { CouchbaseRepository } from '../../db/couchbase.repository'
import { TNote } from '../../notes/types'
import { N1qlQuery } from 'couchbase'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'

const notesForBuildingQuery = bucketName => `
SELECT *
FROM ${bucketName}
WHERE _documentType = 'note' AND context.buildingId = $1
`

export class BuildingNotesRepository extends CouchbaseRepository {
  forBuildingOfId (buildingId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(notesForBuildingQuery(this.bucketName)), [ buildingId ]
    ).then(notes => {
      return fromJSON(notes, t.list(TNote))
    })
  }

  struct () {
    return TNote
  }
}
