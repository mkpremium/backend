import { Owner, OwnerProps } from '../owner'
import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { DateTimeString } from '../../infrastructure/shared-types'
import { NegotiationStatus } from '../../building/building'
import { WorksheetBuilding } from '../../worksheet/repository/worksheet.repository'
import { Repository } from '../../db/repository'


export const FoundOwner = t.struct({
  id: t.String,
  buildingId: t.String,
  negotiationStatus: NegotiationStatus,
  worksheetId: t.String,
  scheduledCalls: t.list(t.struct({
    at: DateTimeString
  })),
  matchingContactId: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    value: t.String,
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
    status: t.enums.of([ 'UNDEFINED', 'GOOD', 'BAD' ])
  })),
  lastEvent: t.maybe(t.struct({
    eventDate: DateTimeString,
    type: t.enums.of([ 'meeting', 'offer-request' ]),
    ownerId: t.String,
    flipperName: t.String
  })),
  building: WorksheetBuilding
})

export const BuildingOwner = t.struct({
  id: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    status: t.enums.of([ 'GOOD', 'BAD', 'UNDEFINED' ]),
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
    value: t.String
  })),
  featuredContact: t.maybe(t.struct({
    phoneId: t.maybe(t.String),
    emailId: t.maybe(t.String)
  })),
  status: t.enums.of(['NO_VERIFICADO', 'VERIFICADO', 'ERRONEO', 'ENTE_PUBLICO', 'WITHOUT_CONTACT', 'WITHOUT_PHONE_CONTACT'])
})

export interface OwnerRepository extends Repository<OwnerProps> {
  findByPhoneNumber (phoneNumber: string): Promise<typeof FoundOwner[]>

  buildingOwners (buildingId: string): Promise<OwnerProps[]>
}
