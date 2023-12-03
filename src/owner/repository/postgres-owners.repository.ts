import { FoundOwnerProps, OwnerRepository } from './owner.repository'
import { OwnerProps } from '../owner'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../owner.entity'
import { DeepPartial, EntityTarget } from 'typeorm'

export class PostgresOwnersRepository extends PostgresRepository<OwnerProps, Owner> implements OwnerRepository {
  // Owners repository
  buildingOwners (buildingId: string): Promise<OwnerProps[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  findByPhoneNumber (phoneNumber: string): Promise<FoundOwnerProps[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  protected entityToStruct (entity: Owner): OwnerProps {
    return null
  }

  protected getEntityTarget (): EntityTarget<Owner> {
    return Owner
  }

  protected structToEntity (owner: OwnerProps): DeepPartial<Owner> {
    return {
      id: owner.id
    }
  }

}
