import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { OwnerResponse } from '../service/owner-response-processor.service'
import { groupBy, NonEmptyArray } from 'fp-ts/NonEmptyArray'

export class VirtualCallsRepository extends CouchbaseRepository<VirtualAgentCallProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualAgentCall
  }

  async previousCallsToNumber (phoneNumber: string): Promise<VirtualAgentCallProps[] | undefined> {
    const query = `
        SELECT \`call\`.*
        FROM ${this.bucketName} \`call\`
        WHERE _documentType = 'virtual-agent-call'
          AND phoneNumber = $1
    `
    return this.couchbaseAdapter.queryAsync(query, [ phoneNumber ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return
        }

        return fromJSON(rows, t.list(this.struct()))
      })
  }

  async callsInRange (since: Date, until: Date) {
    const query = `
        SELECT worksheet.buildingAddress.city,
               \`call\`.ownerResponse,
               count(*) as count
        FROM ${this.bucketName} \`call\`
            JOIN mkpremium worksheet
        ON worksheet._documentType = 'worksheet' AND meta(worksheet).id = \`call\`.worksheetId
        WHERE \`call\`._documentType = 'virtual-agent-call'
          AND \`call\`.createdAt BETWEEN $1
          AND $2
          AND \`call\`.status != 'FAILED'
        GROUP BY worksheet.buildingAddress.city, \`call\`.ownerResponse
    `

    return this.couchbaseAdapter.queryAsync(query, [ since, until ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return
        }

        return parseStats(rows)
      })
  }
}

export function parseStats (rows: { city: string, count: number, ownerResponse: string | null }[]) {
  const countersByCity = groupBy(({ city }) => city)(rows)

  return Object.keys(countersByCity).reduce(
    (acc, city) => {
      const cityCounters = countersByCity[city]
      acc[city] = cityCounters.reduce(
        (acc, { ownerResponse, count }) => {
          switch (ownerResponse) {
            case OwnerResponse.SALE: {
              acc[ 'vende' ] = count
              break
            }
            case OwnerResponse.NO_SALE: {
              acc[ 'no_vende' ] = count
              break
            }
            case OwnerResponse.NOT_OWNER: {
              acc[ 'no_propietario' ] = count
              break
            }
            case null: {
              acc[ 'sin_respuesta' ] = count
              break
            }
            default: {
              acc[ 'otro' ] = (acc[ 'otro' ] || 0) + count
            }
          }
          return acc
        }, {
          'vende': 0,
          'no_vende': 0,
          'no_propietario': 0,
          'sin_respuesta': 0,
          'otro': 0,
          total: cityCounters.reduce((acc, { count }) => acc + count, 0)
        }
      )
      return acc
    },
    {}
  )
}
