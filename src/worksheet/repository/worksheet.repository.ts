import t from 'tcomb'
import { DateTimeString } from '../../infrastructure/shared-types'
import { ContactProps, OwnerStatus, OwnerStatusEnum, OwnerType, OwnerTypeEnum } from '../../owner/owner'
import { WorksheetProps, WorkSheetStatusEnum, WorksheetStatusType } from '../domain/worksheet'
import { BuildingAddressProps, BuildingProps } from '../../building/building'
import { Repository } from '../../db/repository'

export type WorksheetBuildingAddressProps = Omit<BuildingAddressProps, 'fullAddress' | 'postalCode'> &
  {
    postalCode: {
      number: number | string
    }
  }

export type WorksheetBuildingProps =
  Omit<BuildingProps, 'cadastre' | 'address' | 'assignedAgentId' | 'ownerId' | 'metadata'>
  & {
  address: WorksheetBuildingAddressProps;
  metadata: {
    previewUrl: string;
    id: string;
    mimeType: string;
  }[];
  usage?: string;
  cadastreReference?: string;
  latestProposal?: {
    amount: number;
    createdAt: string | Date;
  },
  featuredOwnerId?: string
}

export interface WorksheetOwnerProps {
  id: string;
  name: string;
  status: OwnerStatus;
  person: {
    contacts: ContactProps[]
  },
  featuredContact?: {
    phoneId?: string;
    emailId?: string;
  },
  type: OwnerType;
}

export interface WorksheetViewProps {
  id: string;
  status: WorksheetStatusType;
  building: WorksheetBuildingProps;
  relatedOwners: WorksheetOwnerProps[];
  queueId?: string;
}

export const WorksheetBuilding = t.struct<WorksheetBuildingProps>({
  id: t.String,
  negotiationStatus: t.String,
  latestProposal: t.maybe(t.struct({
    amount: t.Number,
    createdAt: DateTimeString
  })),
  cadastreReference: t.maybe(t.String),
  address: t.struct({
    number: t.union([ t.String, t.Number ]),
    city: t.String,
    province: t.String,
    street: t.String,
    postalCode: t.maybe(t.struct({
      number: t.union([ t.String, t.Number ])
    })),
    neighborhood: t.maybe(t.String),
    type: t.maybe(t.String)
  }),

  metadata: t.list(t.struct({
    previewUrl: t.String,
    id: t.String,
    mimeType: t.String
  })),
  use: t.maybe(t.String),
  usage: t.maybe(t.String),
  location: t.maybe(t.struct({
    lng: t.maybe(t.Number),
    lat: t.maybe(t.Number)
  })),
  recentProposal: t.maybe(t.struct({
    createdAt: t.String,
    proposal: t.Number,
  })),
  cadastre: t.maybe(t.struct({
    reference: t.String,
  })),
  floorArea: t.maybe(t.union([ t.Number, t.String ])),
  featuredOwnerId: t.maybe(t.String)
})

export const CallcenterView = t.struct<WorksheetViewProps>({
  id: t.String,
  status: WorkSheetStatusEnum,
  queueId: t.maybe(t.String),
  building: WorksheetBuilding,
  relatedOwners: t.list(t.struct({
    id: t.String,
    name: t.String,
    person: t.struct({
      contacts: t.list(t.struct({
        id: t.String,
        status: t.enums.of([ 'GOOD', 'BAD', 'UNDEFINED' ]),
        type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
        value: t.String
      }))
    }),
    featuredContact: t.maybe(t.struct({
      phoneId: t.maybe(t.String),
      emailId: t.maybe(t.String)
    })),
    type: OwnerTypeEnum,
    status: OwnerStatusEnum
  }))
})

export class WorksheetNotFound extends Error {
  readonly _type = 'WorksheetNotFound'

  constructor (
    readonly worksheetId,
  ) {
    super('Worksheet not found')
  }
}

export interface WorksheetRepository extends Repository<WorksheetProps> {
  ofBuildingId (buildingId: string): Promise<WorksheetProps>
}
