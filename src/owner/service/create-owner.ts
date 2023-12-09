import { DeepPartial, EntityManager } from 'typeorm'
import { Person } from '../person.entity'
import { Owner } from '../owner.entity'
import { OwnerStatus } from '../owner'

type CreateOwnerCommand = {
  buildingId?: string,
  status: OwnerStatus,
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
  }
}

export async function createOwner (entityManager: EntityManager, cmd: CreateOwnerCommand) {
  // TODO: review and consolidate owner names.
  const person: DeepPartial<Person> = {
    fullName: cmd.person.name,
    firstName: cmd.person.firstName,
    lastName: cmd.person.firstSurname,
  }
  const savedPerson = await entityManager.save(Person, person)
  const savedOwner = await entityManager.save(Owner, {
    person: savedPerson,
    building: cmd.buildingId ? { id: cmd.buildingId } : undefined,
    status: cmd.status
  })
  return [savedOwner, savedPerson]
  }
