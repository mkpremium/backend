import { BuildingOwnerPhone } from '../domain/building-owner-phone'
import { TaskEither } from 'fp-ts/TaskEither'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { fromPromise } from '../../infrastructure/fp-utils'
import { pipe } from 'fp-ts/lib/function'
import { taskEither } from 'fp-ts'
import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types'
import { isRight } from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'
import { KeyNotFound } from '../../db/errors'

export interface LockedOwnerPhone {
  ownerPhone: BuildingOwnerPhone
  cas: any
}

const BuildingOwnerPhoneCodec = t.intersection([
  t.type({
    id: t.string,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString,
    phoneNumber: t.string,
  }),
  t.partial({
    lastSmsSentAt: DateFromISOString,
    lastSmsSentId: t.string,
  })
])

export class BuildingOwnerPhonesRepository {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter,
  ) {
  }

  getByPhoneNumberAndLock (phoneNumber: string): TaskEither<Error, LockedOwnerPhone> {
    const id = BuildingOwnerPhonesRepository.ownerPhoneId(phoneNumber)

    return pipe(
      this.getAndLockPhoneNumber(id),
      taskEither.orElse(error => {
        if (!(error instanceof KeyNotFound)) {
          return taskEither.left(error)
        }
        return pipe(
          this.add(phoneNumber),
          taskEither.chain(() => this.getAndLockPhoneNumber(id))
        )
      }),
      taskEither.chain(({ cas, value }) => {
        const decodedOwnerPhone = BuildingOwnerPhoneCodec.decode(value)
        if (!isRight(decodedOwnerPhone)) {
          return taskEither.left(Error(PathReporter.report(decodedOwnerPhone).join('\n')))
        }

        return taskEither.of({ cas, ownerPhone: decodedOwnerPhone.right })
      })
    )
  }

  private getAndLockPhoneNumber (id: string) {
    return fromPromise(this.couchbaseAdapter.getAndLock(id))
  }

  save (ownerPhone: BuildingOwnerPhone, cas?: any): TaskEither<Error, void> {
    return pipe(
      fromPromise(this.couchbaseAdapter.upsert(ownerPhone.id, { ...ownerPhone, updatedAt: new Date() }, cas))
    )
  }

  add (ownerPhoneNumber: string): TaskEither<Error, BuildingOwnerPhone> {
    const id = BuildingOwnerPhonesRepository.ownerPhoneId(ownerPhoneNumber)

    const ownerPhone: BuildingOwnerPhone = {
      id,
      phoneNumber: ownerPhoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return fromPromise(
      this.couchbaseAdapter.insert(id, ownerPhone).then(() => ownerPhone)
    )
  }

  private static ownerPhoneId (ownerPhoneNumber: string) {
    return `owner_phone_${ownerPhoneNumber}`
  }
}
