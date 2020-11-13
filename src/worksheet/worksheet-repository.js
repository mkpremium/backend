import { Worksheet } from './worksheet'

export class WorksheetRepository {
  /**
   * @param {CouchbaseAdapter} couchbaseAdapter
   */
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  save (worksheet) {
    return this.couchbaseAdapter.save(worksheet, Worksheet)
  }
}
