import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { OwnerResponse } from '../service/owner-response-processor.service'

export class VirtualCallsRepository extends CouchbaseRepository<VirtualAgentCallProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualAgentCall
  }

  async lastCallToNumber (phoneNumber: string): Promise<VirtualAgentCallProps[] | undefined> {
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
        SELECT ownerResponse, count(*) as count
        FROM ${this.bucketName}
        WHERE _documentType = 'virtual-agent-call'
          and createdAt BETWEEN $1
          AND $2
        GROUP BY ownerResponse
    `

    return this.couchbaseAdapter.queryAsync(query, [ since, until ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return
        }

        const response = {}
        let total = 0

        rows.map(({ count, ownerResponse }) => {
          total += count
          switch (ownerResponse) {
            case OwnerResponse.SALE: {
              response[ 'vende' ] = count
              break
            }
            case OwnerResponse.NO_SALE: {
              response[ 'no_vende' ] = count
              break
            }
            case OwnerResponse.NOT_OWNER: {
              response[ 'no_propietario' ] = count
              break
            }
            case null: {
              response[ 'sin_respuesta' ] = count
              break
            }
            default: {
              response[ 'otro' ] = (response[ 'otro' ] || 0) + count
            }
          }
        })
        response[ 'total' ] = total

        return response
      })
  }
}
