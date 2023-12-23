import { WorksheetViewProps } from '../repository/worksheet.repository'
import { CouchbaseWorksheetRepository } from '../repository/couchbase-worksheet.repository'
import { DataSource } from 'typeorm'
import { Worksheet } from '../worksheet.entity'
import { mapEntityToReadModel } from '../../building/repository/postgres-buildings.repository'

export class CallcenterWorksheetService {
  constructor (
    private couchbaseWorksheetRepository: CouchbaseWorksheetRepository,
    private usePostgres: boolean,
    private ormDataSource: DataSource,
  ) {
  }

  async getWorksheetForCallcenterView (worksheetId: string): Promise<WorksheetViewProps> {
    return this.usePostgres ? this.getPostgresWorksheet(worksheetId) : this.couchbaseWorksheetRepository.getForCallcenterView(worksheetId)
  }

  nextAvailableWorksheetInSource (source: {
    province: string | string[]
  }, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    return this.couchbaseWorksheetRepository.nextAvailableWorksheetInSource(source, skipWorksheetId)
  }

  private async getPostgresWorksheet (worksheetId: string): Promise<WorksheetViewProps> {
    const ws = await this.ormDataSource.manager.findOne(Worksheet, {
        where: { id: worksheetId },
        relations: {
          queue: true,
          building: {
            images: true,
            owners: {
              person: {
                contacts: {
                  contact: true
                }
              }
            }
          }
        }
      }
    )

    return {
      id: ws.id,
      status: ws.status,
      queueId: ws.queue?.id,
      building: mapEntityToReadModel(ws.building),
      // relatedOwners: ws.building.owners.map(owner => ({}))
      relatedOwners: []
    }
  }
}
