import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { KeyNotFound } from '../../db/errors'

export class VirtualCallsRepository extends CouchbaseRepository<VirtualAgentCallProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualAgentCall
  }

  async lastCallToNumber (phoneNumber: string): Promise<VirtualAgentCallProps | undefined> {
    const query = `
        SELECT \`call\`.*
        FROM ${this.bucketName} \`call\`
        WHERE _documentType = 'virtual-agent-call'
          AND phoneNumber = $1
        LIMIT 1
    `
    return this.couchbaseAdapter.queryAsync(query, [ phoneNumber ])
      .then(rows => {
        if (!rows || rows.length === 0) {
          return
        }

        return fromJSON(rows[ 0 ], this.struct())
      })
  }

  async lockPhone (phoneNumber: string) {
    return this.couchbaseAdapter
      .getAndLock(`phone_${phoneNumber}`)
      .then(({ cas }) => cas)
      .catch(error => {
        if (error instanceof KeyNotFound) {
          return this.couchbaseAdapter.upsert(`phone_${phoneNumber}`, { phoneNumber, createdAt: new Date() })
            .then(() => this.lockPhone(phoneNumber))
        }

        throw error
      })
  }

  async unlockPhone (phoneNumber: string, lock: any) {
    return this.couchbaseAdapter.unlock(`phone_${phoneNumber}`, lock)
  }
}
