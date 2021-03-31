import { Worksheet, WorkSheetStatusEnum } from '../domain/worksheet'
import t from 'tcomb'
import { OwnerStatusEnum, OwnerTypeEnum } from '../../types/enums'
import { N1qlQuery } from 'couchbase'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { DateTimeString } from '../../infrastructure/shared-types'

export const WorksheetBuilding = t.struct({
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
    postalCode: t.struct({
      number: t.union([ t.String, t.Number ])
    }),
    neighborhood: t.maybe(t.String),
    type: t.maybe(t.String)
  }),

  metadata: t.list(t.struct({
    previewUrl: t.String,
    id: t.String,
    mimeType: t.String
  })),
  use: t.maybe(t.String),
  location: t.struct({
    lng: t.maybe(t.Number),
    lat: t.maybe(t.Number)
  }),
  recentProposal: t.maybe(t.struct({
    createdAt: t.String,
    proposal: t.Number
  })),
  cadastre: t.maybe(t.struct({
    reference: t.String
  })),
  floorArea: t.Number,
  featuredOwnerId: t.maybe(t.String)
})

export const CallcenterView = t.struct({
  id: t.String,
  status: WorkSheetStatusEnum,
  queueId: t.maybe(t.String),
  relatedBuildings: t.list(WorksheetBuilding),
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
  [{
      building.id,
      building.address,
      building.metadata,
      building.\`use\`,
      building.location,
      building.recentProposal,
      building.cadastre,
      building.floorArea,
      building.negotiationStatus,
      "featuredOwnerId": building.ownerId
  }] relatedBuildings,
  ARRAY {o.id, o.name, o.featuredContact, o.type, o.status, 'person': {o.person.contacts} } FOR o IN owners END relatedOwners

FROM ${bucketName} worksheet
JOIN ${bucketName} building ON building._documentType = 'building'
                            AND building.id = worksheet.relatedBuildingIds[0]
NEST ${bucketName} owners ON owners._documentType = 'owner' AND owners.buildingId = building.id
                          AND owners.status NOT IN ['WITHOUT_CONTACT', 'ERRONEO']

WHERE worksheet._documentType = 'worksheet' AND ${conditions.join(' AND ')}
`

const worksheetByIdQuery = bucketName => worksheetForCallcenterViewQuery(bucketName, [ 'worksheet.id = $1' ])

const nextWorksheetAvailableInSourceQuery = (bucketName, source, queueId) => {
  const sourceMatchCondition = Object.keys(source).filter(k => !!source[ k ])
    .map(k => `worksheet.buildingAddress.${k} = "${source[ k ]}"`)

  return `
SELECT worksheet.id
FROM ${bucketName} worksheet

WHERE worksheet._documentType = 'worksheet'
AND worksheet.status IN ['OPEN', 'LOOKING_MEETING']
AND (worksheet.queueId IS NULL OR worksheet.queueId = '${queueId}')
AND ${sourceMatchCondition.join(' AND ')}
ORDER BY worksheet.viewedAt LIMIT 1
`
}

const alreadySoldBuildingWorksheetId = bucketName => `
SELECT id
FROM ${bucketName}
LET buildingIds = ARRAY b.id FOR b IN (SELECT building.id FROM mkpremium building WHERE building._documentType = 'building' AND building.negotiationStatus = 'YA VENDIO') END
WHERE _documentType = 'worksheet' AND relatedBuildingIds[0] IN buildingIds
`

class WorksheetNotFound extends Error {
  constructor (worksheetId) {
    super('Worksheet not found')
    this.worksheetId = worksheetId
  }
}

export class WorksheetRepository extends CouchbaseRepository {
  getForCallcenterView (worksheetId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(worksheetByIdQuery(this.bucketName)),
      [ worksheetId ]
    ).then(rows => {
      if (rows.length === 0) {
        throw new WorksheetNotFound(worksheetId)
      }

      const record = rows[ 0 ]
      if (record.relatedBuildings[ 0 ].recentProposal) {
        record.relatedBuildings[ 0 ].latestProposal = {
          amount: record.relatedBuildings[ 0 ].recentProposal.proposal,
          createdAt: record.relatedBuildings[ 0 ].recentProposal.createdAt
        }
      }
      try {
        return fromJSON(record, CallcenterView)
      } catch (error) {
        this.logWorksheetParsingError(worksheetId, error)
        return record
      }
    })
  }

  nextAvailableWorksheetInSource (source, queueId) {
    const q = nextWorksheetAvailableInSourceQuery(this.bucketName, source, queueId)
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(q)
    ).then(result => {
      if (result.length === 0) {
        return
      }
      return this.getForCallcenterView(result[ 0 ].id)
    })
  }

  getAllWorksheetIdForAlreadySoldBuildings () {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(alreadySoldBuildingWorksheetId(this.bucketName))
    ).then(result => result.map(({ id }) => id))
  }

  logWorksheetParsingError (worksheetId, error) {
    logger.error('parsing worksheet with CallcenterView', {
      worksheetId,
      errorMessage: error.message,
      stack: error.stack
    })
  }

  struct () {
    return Worksheet
  }
}
