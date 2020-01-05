import t from 'tcomb'
import merge from 'deepmerge'
import { MigrateModelV2 } from './migrate-model-v2'
import { PersonRepository } from '../../owner/models'

export class MigrateOwner extends MigrateModelV2 {
  constructor (filename, app) {
    super('owner', filename, app)
  }

  async processFunc (data, row) {
    const { person, owner } = this.parseData(data)
    const currentPerson = await MigrateOwner.findPerson(person.name)
    let updatedOwner = owner
    if (currentPerson) {
      const mergedPerson = merge(person, currentPerson)
      updatedOwner = t.update(owner, {
        personId: { $set: mergedPerson.id },
        person: { $set: mergedPerson }
      })
    } else {
      await this.pushToDatabase(person)
    }

    await this.pushToDatabase(updatedOwner)
  }

  static async findPerson (name) {
    const cleanName = name.replace(/\d/g, '').trim()
    const repo = new PersonRepository()
    const qb = repo.getQueryBuilder()
      .where('t.name = ?', cleanName)
    const [person] = await repo.query(qb)

    return person
  }
}
