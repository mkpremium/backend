import t, { Struct } from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { EntityNotFound } from '../../db/errors'
import { logger } from '../../infrastructure/logger'
import { DateTimeString } from '../../infrastructure/shared-types'
import { ContactProps, OwnerStatus, OwnerStatusEnum, OwnerType, OwnerTypeEnum } from '../../owner/owner'
import { Worksheet, WorksheetProps, WorkSheetStatusEnum, WorksheetStatusType } from '../domain/worksheet'
import { BuildingAddressProps, BuildingProps } from '../../building/building'

export type WorksheetBuildingAddressProps = Omit<BuildingAddressProps, 'fullAddress' | 'postalCode'> &
  {
    postalCode: {
      number: number | string
    }
  }

export type WorksheetBuildingProps = Omit<BuildingProps, 'cadastre' | 'address' | 'assignedAgentId' | 'ownerId'>
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
    createdAt: string;
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

const worksheetForCallcenterViewQuery = (bucketName, conditions) => `
SELECT
  worksheet.id id,
  worksheet.status status,
  worksheet.queueId queueId,
  {
      building.id,
      building.address,
      building.metadata,
      building.\`use\`,
      "usage": building.\`use\`,
      building.location,
      building.recentProposal,
      building.cadastre,
      building.floorArea,
      "negotiationStatus": CASE WHEN building.negotiationStatus IS MISSING THEN "PENDIENTE" ELSE building.negotiationStatus END,
      "featuredOwnerId": building.ownerId,
      "cadastreReference": building.cadastre.reference
  } building,
  ARRAY {
    o.id,
    o.name,
    o.featuredContact,
    o.type,
    o.status,
    "person": {
        "contacts": ARRAY c FOR c IN o.person.contacts WHEN c.status != 'BAD' END
    }
  } FOR o IN owners END relatedOwners

FROM ${bucketName} worksheet
JOIN ${bucketName} building ON building._documentType = 'building'
                            AND building.id = worksheet.relatedBuildingIds[0]
NEST ${bucketName} owners ON owners._documentType = 'owner' AND owners.buildingId = building.id
                          AND owners.status NOT IN ['WITHOUT_CONTACT', 'ERRONEO']

WHERE worksheet._documentType = 'worksheet' AND ${conditions.join(' AND ')}
`

const worksheetByIdQuery = bucketName => worksheetForCallcenterViewQuery(bucketName, [ 'worksheet.id = $1' ])

const nextWorksheetAvailableInSourceQuery = (bucketName, source, skipWorksheetId) => {
  const sourceMatchCondition = Object.keys(source).filter(k => !!source[ k ])
    .map(k => {
      const expr = Array.isArray(source[ k ]) ?
        `IN [${source[ k ].map(val => `"${val}"`).join(',')}]` :
        `= "${source[ k ]}"`
      return `worksheet.buildingAddress.${k} ` + expr
    })

  return `
SELECT worksheet.id
FROM ${bucketName} worksheet

WHERE worksheet._documentType = 'worksheet'
  AND worksheet.status IN ['OPEN', 'LOOKING_MEETING']
  AND worksheet.queueId IS NULL
  AND ${sourceMatchCondition.join(' AND ')}
  ${skipWorksheetId ? `AND worksheet.id != "${skipWorksheetId}"` : ''}
ORDER BY worksheet.viewedAt LIMIT 1
`
}

export class WorksheetNotFound extends Error {
  readonly _type = 'WorksheetNotFound'
  constructor (
    readonly worksheetId,
  ) {
    super('Worksheet not found')
  }
}

export class WorksheetRepository extends CouchbaseRepository<WorksheetProps> {
  getForCallcenterView (worksheetId): Promise<WorksheetViewProps> {
    return this.couchbaseAdapter.queryAsync(
      worksheetByIdQuery(this.bucketName), [ worksheetId ], {queryName: 'worksheet_view'}
    )
      .catch(error => {
        error.worksheetId = worksheetId
        error.context = 'Getting worksheet view'
        throw error
      })
      .then(rows => {
        if (rows.length === 0) {
          throw new WorksheetNotFound(worksheetId)
        }

        const record = WorksheetRepository.prepareRowsForParsing(rows)

        try {
          return fromJSON(record, CallcenterView)
        } catch (error) {
          this.logWorksheetParsingError(worksheetId, error)
          return record
        }
      })
  }

  static prepareRowsForParsing (rows) {
    const record = rows[ 0 ]
    if (record.building.recentProposal) {
      record.building.latestProposal = {
        amount: record.building.recentProposal.proposal,
        createdAt: record.building.recentProposal.createdAt
      }
    }
    if (record.building.address.postalCode && !record.building.address.postalCode.number) {
      delete record.building.address.postalCode
    }
    return record
  }

  nextAvailableWorksheetInSource (source, skipWorksheetId): Promise<WorksheetViewProps> {
    const q = nextWorksheetAvailableInSourceQuery(this.bucketName, source, skipWorksheetId)
    return this.couchbaseAdapter.queryAsync(q, undefined, {queryName: 'next_worksheet_in_source'})
      .then(result => {
        if (result.length === 0) {
          return
        }
        return this.getForCallcenterView(result[ 0 ].id)
      })
  }

  ofBuildingId (buildingId): Promise<WorksheetProps> {
    return this.couchbaseAdapter.queryAsync(`
        SELECT worksheet.*
        FROM ${this.bucketName} worksheet
        WHERE worksheet._documentType = 'worksheet'
          AND worksheet.relatedBuildingIds[0] = $1
    `, [ buildingId ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          throw new EntityNotFound(`worksheet.buildingId=${buildingId}`, this.struct())
        }

        return fromJSON(rows[ 0 ], this.struct())
      })
  }

  struct (): Struct<WorksheetProps> {
    return Worksheet
  }

  private logWorksheetParsingError (worksheetId, error) {
    logger.error('parsing worksheet with CallcenterView', {
      worksheetId,
      errorMessage: error.message,
      stack: error.stack
    })
  }
}
