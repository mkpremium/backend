import { ContactProps, ContactType, OwnerContactStatus, OwnerProps, OwnerStatus, OwnerType } from '../owner'
import t from 'tcomb'
import { DateTimeString } from '../../infrastructure/shared-types'
import { BuildingNegotiationStatus, NegotiationStatus } from '../../building/building'
import { WorksheetBuilding, WorksheetBuildingProps, } from '../../worksheet/repository/worksheet.repository'
import { Repository } from '../../db/repository'


export interface FoundOwnerProps {
  id: string
  buildingId: string,
  negotiationStatus: BuildingNegotiationStatus,
  worksheetId: string,
  scheduledCalls: { at: string }[],
  matchingContactId: string,
  name: string,
  contacts: {
    id: string,
    value: string,
    type: 'TELEFONO' | 'MOVIL' | 'EMAIL',
    status: OwnerContactStatus,
  }[]
  lastEvent?: {
    eventDate: string,
    type: 'meeting' | 'offer-request',
    ownerId: string,
    flipperName: string
  },
  building: WorksheetBuildingProps,
}


export const FoundOwner = t.struct<FoundOwnerProps>({
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

export interface BuildingOwnerProps {
  id: string;
  name: string;
  contacts: ContactProps[];
  status: OwnerStatus
  featuredContact?: {
    phoneId?: string
    emailId?: string
  }
  type: OwnerType // TODO: is still needed?
}

export const BuildingOwner = t.struct<BuildingOwnerProps>({
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
  status: t.enums.of([ 'NO_VERIFICADO', 'VERIFICADO', 'ERRONEO', 'ENTE_PUBLICO', 'WITHOUT_CONTACT', 'WITHOUT_PHONE_CONTACT' ])
})


export interface OwnerRepository extends Repository<OwnerProps> {
  findByPhoneNumber (phoneNumber: string): Promise<FoundOwnerProps[]>

  buildingOwners (buildingId: string): Promise<BuildingOwnerProps[]>

  verifiedOwnersOfBuildingWithId (buildingId: string): Promise<BuildingOwnerProps[]>
}
