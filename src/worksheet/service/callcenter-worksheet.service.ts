import { WorksheetViewProps } from '../repository/worksheet.repository'
import { DataSource } from 'typeorm'
import { Worksheet } from '../worksheet.entity'
import { buildingEntityToReadModel } from '../../building/repository/postgres-buildings.repository'

export class CallcenterWorksheetService {
  constructor (
    private ormDataSource: DataSource
  ) {
  }

  async getWorksheetForCallcenterView (worksheetId: string): Promise<WorksheetViewProps> {
    const ws = await this.getWorksheetQueryBuilder()
      .where('worksheet.id = :worksheetId', { worksheetId })
      .getOne()

    return toView(ws)
  }

  async nextAvailableWorksheetInSource (source: {
    province: string | string[]
  }, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    let builder = this.ormDataSource.manager.createQueryBuilder(Worksheet, 'worksheet')
      .innerJoinAndSelect('worksheet.building', 'building')
      .where('building.address ->> \'province\' IN (:...provinces)',
        { provinces: [].concat(source.province) })
      .andWhere('worksheet.queueId IS NULL')
      .andWhere('worksheet.status IN (:...statuses)', { statuses: ['OPEN', 'LOOKING_MEETING'] })
      .andWhere(`exists (select *
              from owner
              where "buildingId" = building.id
                and owner.status not in ('ERRONEO', 'ENTE_PUBLICO', 'WITHOUT_CONTACT', 'WITHOUT_PHONE_CONTACT'))`)

    if (skipWorksheetId) {
      builder = builder.where('worksheet.id != :skipWorksheetId', { skipWorksheetId })
    }

    const nextWorksheet = await builder
      .orderBy('worksheet.lastViewedAt', 'ASC')
      .limit(1)
      .getOneOrFail()

    return this.getWorksheetForCallcenterView(nextWorksheet.id)
  }

  private getWorksheetQueryBuilder () {
    return this.ormDataSource.manager.createQueryBuilder(Worksheet, 'worksheet')
      .innerJoinAndSelect('worksheet.building', 'building')
      .innerJoinAndSelect('building.owners', 'owners')
      .innerJoinAndSelect('owners.person', 'person')
      .innerJoinAndSelect('person.contacts', 'contacts')
      .innerJoinAndSelect('contacts.contact', 'contact')
      .leftJoinAndSelect('building.documents', 'documents')
      .leftJoinAndSelect('worksheet.queue', 'queue')
      .leftJoinAndSelect('building.proposals', 'proposals')
  }
}

function toView (ws: Worksheet): WorksheetViewProps {
  return {
    id: ws.id,
    status: ws.status,
    queueId: ws.queue?.id,
    building: buildingEntityToReadModel(ws.building),
    relatedOwners: ws.building.owners.map(o => ({
      ...o,
      name: o.person.fullName,
      person: {
        contacts: o.person.contacts.map(oc => ({ ...oc.contact, status: oc.status }))
      }
    }))
  }
}
