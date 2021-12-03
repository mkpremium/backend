import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import * as TE from 'fp-ts/TaskEither'

export class Portugal20210BuildingsRepository {
  constructor (private couchbaseAdapter: CouchbaseAdapter,) {
  }

  pendingWithSlug (slug: string): TE.TaskEither<Error, unknown> {
    return undefined
  }

  save (param: unknown): TE.TaskEither<Error, void> {
    return undefined
  }
}
