import { BuildingOwnerProps, OwnerRepository } from './owner.repository'
import { OwnerProps } from '../owner'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../owner.entity'
import { DeepPartial, EntityTarget, In } from 'typeorm'

export class PostgresOwnersRepository extends PostgresRepository<OwnerProps, Owner> implements OwnerRepository {
  protected relations = {
    building: true,
    person: {
      contacts: {
        contact: true
      },
      featuredPhoneContact: true,
      featuredEmailContact: true,
    }
  }

  // Owners repository
  async buildingOwners (buildingId: string | string[]): Promise<(BuildingOwnerProps & { buildingId: string })[]> {
    const owners = await this.repository.find({
      where: {
        building: { id: In([].concat(buildingId)) },
      },
      relations: this.relations,
    })

    return owners.map(ownerEntityToBuildingOwnerProps)
  }

  verifiedOwnersOfBuildingWithId (buildingId: string): Promise<BuildingOwnerProps[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  protected entityToStruct (entity: Owner): OwnerProps {
    return ownerEntityToStruct(entity)
  }

  protected getEntityTarget (): EntityTarget<Owner> {
    return Owner
  }

  protected structToEntity (owner: OwnerProps): DeepPartial<Owner> {
    return {
      id: owner.id,
      status: owner.status,
      building: owner.buildingId ? {id: owner.buildingId} : null,
      person: {
        fullName: owner.person.name,
        contacts: owner.person.contacts,
        featuredPhoneContact: owner.featuredContact?.phoneId ? { id: owner.featuredContact?.phoneId } : null,
        featuredEmailContact: owner.featuredContact?.emailId ? { id: owner.featuredContact?.emailId } : null,
        documentNumber: owner.person.documentNumber,
      }
    }
  }
}

export function ownerEntityToStruct(entity: Owner): OwnerProps {
  return {
    id: entity.id,
    status: entity.status,
    name: entity.person.fullName,
    buildingId: entity.building.id,
    person: {
      name: entity.person.fullName,
      contacts: entity.person.contacts.map(cp => ({...cp.contact, status: cp.status})),
    },
    featuredContact: entity.person.featuredEmailContact || entity.person.featuredPhoneContact ? {
      phoneId: entity.person.featuredPhoneContact?.id,
      emailId: entity.person.featuredEmailContact?.id,
    } : null
  }
}

function ownerEntityToBuildingOwnerProps (entity: Owner): BuildingOwnerProps & { buildingId: string } {
  const ownerProps = ownerEntityToStruct(entity)

  return {
    id: entity.id,
    buildingId: entity.building.id,
    status: entity.status,
    name: ownerProps.name,
    featuredContact: ownerProps.featuredContact,
    type: entity.type,
    contacts: ownerProps.person.contacts,
  }
}
