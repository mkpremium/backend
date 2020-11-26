import { WorksheetQueue } from '../domain/worksheet'
import { CouchbaseRepository } from '../../db/couchbase.repository'

export class WorksheetQueueRepository extends CouchbaseRepository {
  struct () {
    return WorksheetQueue
  }
}
