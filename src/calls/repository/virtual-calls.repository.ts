import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { OwnerResponse } from '../service/owner-response-processor.service'
import { groupBy } from 'fp-ts/NonEmptyArray'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import moment from "moment";

type CallsByProvince = {
  no_vende: number
  no_propietario: number
  vende: number
  sin_respuesta: number
  otro: number
  total: number
}
const FREEZER_LENGTH_MONTHS = 3

export class VirtualCallsRepository extends CouchbaseRepository<VirtualAgentCallProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualAgentCall
  }

  async previousCallsToNumber (phoneNumber: string): Promise<VirtualAgentCallProps[] | undefined> {
    const currentPeriodBeginning = moment().add(-FREEZER_LENGTH_MONTHS, 'months').startOf('day')
    const query = `
        SELECT \`call\`.*
        FROM ${this.bucketName} \`call\`
        WHERE _documentType = 'virtual-agent-call'
          AND createdAt > ${currentPeriodBeginning.format()}
          AND phoneNumber = '$1'
    `
    return this.couchbaseAdapter.queryAsync(query, [ phoneNumber ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return
        }

        return fromJSON(rows, t.list(this.struct()))
      })
  }

  callsByProvinceBetween (since: string, until: string): TE.TaskEither<Error, Record<string, CallsByProvince>> {
    const query = `
        SELECT worksheet.buildingAddress.province,
               \`call\`.ownerResponse,
               count(*) as count
        FROM ${this.bucketName} \`call\`
            JOIN ${this.bucketName} worksheet
        ON worksheet._documentType = 'worksheet' AND meta(worksheet).id = \`call\`.worksheetId
        WHERE \`call\`._documentType = 'virtual-agent-call'
          AND \`call\`.createdAt BETWEEN $1 AND $2
          AND \`call\`.status != 'FAILED'
        GROUP BY worksheet.buildingAddress.province, \`call\`.ownerResponse
    `

    return TE.tryCatch(
      () => this.couchbaseAdapter.queryAsync(query, [ since, until ])
        .then(rows => {
          if (!rows || rows.length === 0) {
            return {}
          }

          return parseCallsByProvince(rows)
        }),
      reason => reason instanceof Error ? reason : new Error(String(reason))
    )
  }

  worksheetsByProvinceBetween (since: string, until: string): TE.TaskEither<Error, Record<string, number>> {
    const query = `
        SELECT worksheet.buildingAddress.province,
               count(DISTINCT \`call\`.worksheetId) as count
        FROM ${this.bucketName} \`call\`
            JOIN mkpremium worksheet
        ON worksheet._documentType = 'worksheet' AND meta(worksheet).id = \`call\`.worksheetId
        WHERE \`call\`._documentType = 'virtual-agent-call'
          AND \`call\`.createdAt BETWEEN $1 AND $2
          AND \`call\`.status != 'FAILED'
        GROUP BY worksheet.buildingAddress.province
    `

    return TE.tryCatch(
      () => this.couchbaseAdapter.queryAsync(query, [ since, until ])
        .then(rows => {
          if (!rows || rows.length === 0) {
            return {}
          }

          return rows.reduce((acc, { province, count }) => ({ ...acc, [ province ]: count }), {})
        }),
      reason => reason instanceof Error ? reason : new Error(String(reason))
    )
  }

  lastCallTo (phoneNumber: string): TE.TaskEither<Error, VirtualAgentCallProps | undefined> {
    const query = `
        SELECT \`call\`.*
        FROM ${this.bucketName} \`call\`
        WHERE _documentType = 'virtual-agent-call'
          AND phoneNumber = '$1'
        ORDER BY createdAt DESC
            LIMIT 1
    `
    return pipe(
      TE.tryCatch(
        () => this.couchbaseAdapter.queryAsync(query, [ phoneNumber ]),
        reason => reason as Error
      ),
      TE.map(lastCallRow => {
        if (!lastCallRow || lastCallRow.length === 0) {
          return
        }
        return fromJSON(lastCallRow[ 0 ], this.struct())
      })
    )
  }
}

export function parseCallsByProvince (rows: { province: string, count: number, ownerResponse: string | null }[]) {
  const countersByProvince = groupBy(({ province }) => province)(rows)

  return Object.keys(countersByProvince).reduce(
    (acc, province) => {
      const provinceCounters = countersByProvince[ province ]
      acc[ province ] = provinceCounters.reduce(
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
          total: provinceCounters.reduce((acc, { count }) => acc + count, 0)
        }
      )
      return acc
    },
    {}
  )
}
