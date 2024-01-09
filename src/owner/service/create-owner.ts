import { DeepPartial, EntityManager } from 'typeorm'
import { Person } from '../person.entity'
import { Owner } from '../owner.entity'
import { OwnerStatus } from '../owner'

type CreateOwnerCommand = {
  id?: string,
  buildingId?: string,
  status: OwnerStatus,
  person: {
    name: string,
    firstName: string,
    firstSurname: string,
  }
}

export async function createOwner (entityManager: EntityManager, cmd: CreateOwnerCommand): Promise<[ Owner, Person ]> {
  if (cmd.person.name !== `${cmd.person.firstName} ${cmd.person.firstSurname}`) {
    console.warn(`Owner name ${cmd.person.name} does not match first name ${cmd.person.firstName} and first surname ${cmd.person.firstSurname}`, cmd)
  }
  if (!cmd.buildingId) {
    console.warn('Owner does not have a building', cmd)
  }

  // TODO: review and consolidate owner names.
  const person: DeepPartial<Person> = {
    fullName: cmd.person.name,
    firstName: cmd.person.firstName,
    lastName: cmd.person.firstSurname,
  }
  const savedPerson = await entityManager.save(Person, person)
  const savedOwner = await entityManager.save(Owner, {
    id: cmd.id,
    person: savedPerson,
    building: cmd.buildingId ? { id: cmd.buildingId } : undefined,
    status: cmd.status
  })
  return [ savedOwner, savedPerson ]
}
