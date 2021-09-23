import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import { KeyNotFound } from '../../db/errors'
import fromJSON from 'tcomb/lib/fromJSON'
import { CallerPhone, CallerPhoneProps } from '../domain/caller.phone'

export interface LockedPhone {
  phone: CallerPhoneProps,
  cas: any
}

export class VirtualCallerPhonesRepository extends CouchbaseRepository<CallerPhoneProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return CallerPhone
  }

  async lockPhone (phoneNumber: string): Promise<LockedPhone> {
    const id = `phone_${phoneNumber}`
    return this.couchbaseAdapter
      .getAndLock(id)
      .then(({ cas, value }) => ({
        cas, phone: fromJSON<CallerPhoneProps>({ ...value, lastLockAcquiredAt: new Date() }, CallerPhone)
      }))
      .catch(error => {
        if (error instanceof KeyNotFound) {
          return this.couchbaseAdapter.upsert(id, CallerPhone({ id } as any))
            .then(() => this.lockPhone(phoneNumber))
        }

        throw error
      })
  }

  async unlockPhone (phoneNumber: string, lock: any) {
    return this.couchbaseAdapter.unlock(`phone_${phoneNumber}`, lock)
  }

  async saveWithLock (lockedPhone: LockedPhone) {
    return this.couchbaseAdapter.save(
      CallerPhone(lockedPhone.phone as CallerPhoneProps & { _documentType: string }),
      CallerPhone,
      lockedPhone.cas
    )
  }
}
