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
    return this.usePostgres ? this.nextAvailableWorksheetInSourcePostgres(source, skipWorksheetId) :
      this.couchbaseWorksheetRepository.nextAvailableWorksheetInSource(source, skipWorksheetId)
  }

  private async getPostgresWorksheet (worksheetId: string): Promise<WorksheetViewProps> {
    const ws = await this.ormDataSource.manager.findOne(Worksheet, {
      where: { id: worksheetId },
      relations: {
        queue: true,
        building: {
          images: true,
          proposals: true,
          owners: {
            person: {
              contacts: {
                contact: true
              }
            }
          }
        }
      }
    })

    return toView(ws)
  }

  private async nextAvailableWorksheetInSourcePostgres (source: {
    province: string | string[]
  }, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    const ws = await this.ormDataSource.manager.createQueryBuilder(Worksheet, 'worksheet')
      .innerJoinAndSelect('worksheet.building', 'building')
      .innerJoinAndSelect('building.owners', 'owners')
      .innerJoinAndSelect('owners.person', 'person')
      .innerJoinAndSelect('person.contacts', 'contacts')
      .innerJoinAndSelect('contacts.contact', 'contact')
      .leftJoinAndSelect('building.images', 'images')
      .where('building.address ::jsonb @> :address', { address: { province: source.province } })
      .orderBy('worksheet.lastViewedAt')
      .getOne()

    return toView(ws)
  }
}

function toView (ws: Worksheet): WorksheetViewProps {
  return {
    id: ws.id,
    status: ws.status,
    queueId: ws.queue?.id,
    building: mapEntityToReadModel(ws.building),
    relatedOwners: ws.building.owners.map(o => ({
      ...o,
      type: 'PRINCIPAL', // TODO
      name: o.person.fullName,
      person: {
        contacts: o.person.contacts.map(oc => ({ ...oc.contact, status: oc.status })),
      }
    })),
  }
}
