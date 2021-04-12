import { CouchbaseRepository } from '../../db/couchbase.repository'
import t from 'tcomb'

const DbEvaluationRequest = t.struct({})

export class EvaluationRequestsRepository extends CouchbaseRepository {
  struct () {
    return DbEvaluationRequest
  }
}
