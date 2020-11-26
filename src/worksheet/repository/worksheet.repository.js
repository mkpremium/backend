import { Worksheet, WorkSheetStatusEnum } from '../domain/worksheet'
import t from 'tcomb'
import { OwnerStatusEnum, OwnerTypeEnum } from '../../types/enums'
import { N1qlQuery } from 'couchbase'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { CouchbaseRepository } from '../../db/couchbase.repository'

const worksheetForCallcenterViewQuery = bucketName => `
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
    building.floorArea
}] relatedBuildings,
ARRAY {o.id, o.name, o.featuredContact, o.type, o.status, 'person': {o.person.contacts} } FOR o IN owners END relatedOwners

FROM ${bucketName} worksheet
JOIN ${bucketName} building ON building._documentType = 'building' AND
building.id = worksheet.relatedBuildingIds[0]
NEST ${bucketName} owners ON owners._documentType = 'owner' AND owners.buildingId = building.id

WHERE worksheet._documentType = 'worksheet' AND worksheet.id = $1
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
      N1qlQuery.fromString(worksheetForCallcenterViewQuery(this.bucketName)),
      [ worksheetId ]
    ).then(rows => {
      if (rows.length === 0) {
        throw new WorksheetNotFound(worksheetId)
      }

      try {
        return fromJSON(rows[ 0 ], CallcenterView)
      } catch (error) {
        logger.error('parsing worksheet with CallcenterView', { worksheetId })
        return rows[ 0 ]
      }
    })
  }

  struct () {
    return Worksheet
  }
}

export const CallcenterView = t.struct({
  id: t.String,
  status: WorkSheetStatusEnum,
  queueId: t.String,
  relatedBuildings: t.list(t.struct({
    id: t.String,
    address: t.struct({
      number: t.union([ t.String, t.Number ]),
      city: t.String,
      street: t.String,
      postalCode: t.struct({
        number: t.union([ t.String, t.Number ])
      }),
      neighborhood: t.String,
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
    floorArea: t.Number
  })),
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
