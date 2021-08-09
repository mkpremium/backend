import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { KeyNotFound } from '../../db/errors'
import { OwnerResponse } from '../service/owner-response-processor.service'

const LockedPhoneValue = t.struct<{ _documentType: string, status: 'AVAILABLE' | 'BUSY' }>({
  status: t.maybe(t.enums.of([ 'AVAILABLE', 'BUSY' ])),
  _documentType: t.String
})

export interface LockedPhone {
  value: { status?: 'AVAILABLE' | 'BUSY' },
  cas: any
}

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
        ORDER BY createdAt DESC
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

  async unlockPhone (phoneNumber: string, lock: any) {
    return this.couchbaseAdapter.unlock(`phone_${phoneNumber}`, lock)
  }

  async lockPhone (phoneNumber: string): Promise<LockedPhone> {
    return this.couchbaseAdapter
      .getAndLock(`phone_${phoneNumber}`)
      .catch(error => {
        if (error instanceof KeyNotFound) {
          return this.couchbaseAdapter.upsert(`phone_${phoneNumber}`, { phoneNumber, createdAt: new Date() })
            .then(() => this.lockPhone(phoneNumber))
        }

        throw error
      })
  }

  savePhoneLock (lockedPhone: LockedPhone) {
    return this.couchbaseAdapter.save(
      { ...lockedPhone.value, _documentType: 'phone-lock' },
      LockedPhoneValue,
      lockedPhone.cas
    )
  }

  savePhoneStatus (phoneNumber: string, status: 'BUSY' | 'AVAILABLE') {
    return this.couchbaseAdapter.save(
      { status, _documentType: 'phone-lock' },
      LockedPhoneValue
    )
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
