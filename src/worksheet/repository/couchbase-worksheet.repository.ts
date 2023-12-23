import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Worksheet, WorksheetProps } from '../domain/worksheet'
import fromJSON from 'tcomb/lib/fromJSON'
import { EntityNotFound } from '../../db/errors'
import { Struct } from 'tcomb'
import { logger } from '../../infrastructure/logger'
import { CallcenterView, WorksheetNotFound, WorksheetRepository, WorksheetViewProps } from './worksheet.repository'

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

export class CouchbaseWorksheetRepository extends CouchbaseRepository<WorksheetProps>
  implements WorksheetRepository {
  getForCallcenterView (worksheetId: string): Promise<WorksheetViewProps> {
    return this.couchbaseAdapter.queryAsync(
      worksheetByIdQuery(this.bucketName), [ worksheetId ], { queryName: 'worksheet_view' }
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

        const record = CouchbaseWorksheetRepository.prepareRowsForParsing(rows)

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

  async nextAvailableWorksheetInSource (source: {
    province: string | string[]
  }, skipWorksheetId?: string): Promise<WorksheetViewProps> {
    const q = nextWorksheetAvailableInSourceQuery(this.bucketName, source, skipWorksheetId)
    const result = await this.couchbaseAdapter.queryAsync(q, undefined, { queryName: 'next_worksheet_in_source' })
    if (result.length === 0) {
      return
    }
    return this.getForCallcenterView(result[ 0 ].id)
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
