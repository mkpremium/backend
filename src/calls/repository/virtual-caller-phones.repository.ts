import { CouchbaseRepository } from '../../db/couchbase.repository'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import { KeyNotFound } from '../../db/errors'
import fromJSON from 'tcomb/lib/fromJSON'

interface VirtualCallerPhoneProps {
  id: string,
  status: 'AVAILABLE' | 'BUSY'
  createdAt: Date
}

const VirtualCallerPhone = t.struct<VirtualCallerPhoneProps & { _documentType: string }>({
  id: t.refinement(t.String, id => id.startsWith('phone_')),
  status: t.maybe(t.enums.of([ 'AVAILABLE', 'BUSY' ])),
  createdAt: t.Date,
  _documentType: t.refinement(t.String, dt => dt === 'virtual-caller-phone')
}, {
  name: 'VirtualCallerPhone',
  defaultProps: {
    _documentType: 'virtual-caller-phone',
    status: 'AVAILABLE',
    get createdAt () {
      return new Date()
    }
  }
})

export interface LockedPhone {
  phone: VirtualCallerPhoneProps,
  cas: any
}

export class VirtualCallerPhonesRepository extends CouchbaseRepository<VirtualCallerPhoneProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualCallerPhone
  }

  async lockPhone (phoneNumber: string): Promise<LockedPhone> {
    const id = `phone_${phoneNumber}`
    return this.couchbaseAdapter
      .getAndLock(id)
      .then(({ cas, value }) => ({
        cas, phone: fromJSON<VirtualCallerPhoneProps>(value as any, VirtualCallerPhone)
      }))
      .catch(error => {
        if (error instanceof KeyNotFound) {
          return this.couchbaseAdapter.upsert(id, VirtualCallerPhone({ id } as any))
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
      VirtualCallerPhone(lockedPhone.phone as any),
      VirtualCallerPhone,
      lockedPhone.cas
    )
  }
}
