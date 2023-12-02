import { FoundOwner, OwnerRepository } from './owner.repository'
import { OwnerProps } from '../owner'

export class PostgresOwnersRepository implements OwnerRepository {
  // Repository
  get (id: string): Promise<OwnerProps> {
    return Promise.reject(new Error('Not implemented'))
  }

  save (data: OwnerProps): Promise<OwnerProps> {
    return Promise.reject(new Error('Not implemented'))
  }

  // Owners repository
  buildingOwners (buildingId: string): Promise<OwnerProps[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  findByPhoneNumber (phoneNumber: string): Promise<typeof FoundOwner[]> {
    return Promise.reject(new Error('Not implemented'))
  }

}
