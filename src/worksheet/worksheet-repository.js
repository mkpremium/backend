import { Worksheet } from '../types/worksheet'

export class WorksheetRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  save (worksheet) {
    return this.couchbaseAdapter.save(worksheet, Worksheet)
  }
}
