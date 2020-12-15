import { CouchbaseRepository } from '../../db/couchbase.repository'
import { TNote } from '../../notes/types'

export class BuildingNotesRepository extends CouchbaseRepository {
  struct () {
    return TNote
  }
}
