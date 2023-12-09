import { DeepPartial, EntityManager } from 'typeorm'
import { Person } from '../person.entity'
import { Owner } from '../owner.entity'

export async function createOwner (entityManager: EntityManager, cmd) {
  const person: DeepPartial<Person> = {
    fullName: cmd.person.name,
    firstName: cmd.person.firstName,
    lastName: cmd.person.firstSurname,
  }
  const savedPerson = await entityManager.save(Person, person)
  const savedOwner = await entityManager.save(Owner, {
    person: savedPerson,
    building: { id: cmd.buildingId },
    status: cmd.status
  })
  return [savedOwner, savedPerson]
  }
