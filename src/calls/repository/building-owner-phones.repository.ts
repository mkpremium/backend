import { BuildingOwnerPhone } from '../domain/building-owner.phone'
import { TaskEither } from 'fp-ts/TaskEither'

export interface LockedOwnerPhone {
  ownerPhone: BuildingOwnerPhone
  cas: any
}

export class BuildingOwnerPhonesRepository {
  getByPhoneNumberAndLock (to: string): TaskEither<Error, LockedOwnerPhone> {
    throw new Error('not implemented')
  }

  save (ownerPhone: BuildingOwnerPhone, cas: any): TaskEither<Error, void> {
    throw new Error('not implemented')
  }
}
