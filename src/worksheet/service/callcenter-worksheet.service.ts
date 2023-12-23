import { WorksheetViewProps } from '../repository/worksheet.repository'
import { CouchbaseWorksheetRepository } from '../repository/couchbase-worksheet.repository'

export class CallcenterWorksheetService {
  constructor (private couchbaseWorksheetRepository: CouchbaseWorksheetRepository) {
  }

  async getWorksheetForCallcenterView (worksheetId: string): Promise<WorksheetViewProps> {
    return this.couchbaseWorksheetRepository.getForCallcenterView(worksheetId)
  }

  nextAvailableWorksheetInSource (source: {
    province: string | string[]
  }, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    return this.couchbaseWorksheetRepository.nextAvailableWorksheetInSource(source, skipWorksheetId)
  }
}
