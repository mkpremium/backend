import { N1qlQuery } from 'couchbase'
import _ from 'lodash'
import _head from 'lodash/head'
import _isArray from 'lodash/isArray'
import _isNil from 'lodash/isNil'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { BuildingRepository } from '../building/models'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { updateList } from '../lib/tcomb-utils'
import { OwnerStatus } from '../types/enums'
import { Owner, OwnerBody, Person as PersonStruct } from '../types/owner'
import { WorksheetRepository } from '../worksheet/models/worksheet'
import { OwnerListQuery } from './types'

export class PersonRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = PersonStruct
  }

  async findByIdOrThrow (personId) {
    const person = await this.findById(personId)
    if (!person) {
      throw newHttpError(404, `La persona ${personId} no existe`)
    }

    return person
  }

  async updateContact (personId, contactId, data) {
    const person = await this.findByIdOrThrow(personId)
    const contact = person.findContactById(contactId)
    if (!contact) {
      throw newHttpError(400, `La información de contacto ${contactId} no fue encontrada y no pudo actualizarse`)
    }

    const updatedContacts = updateList(person.contacts, contact, Object.assign({}, data, { id: contactId }))
    const updatedPerson = t.update(person, { contacts: { $merge: updatedContacts } })

    return this.save(updatedPerson)
  }

  async addContact (personId, body = {}) {
    const newContact = new t.TypedContactInfo(body)
    const person = await this.findById(personId)

    if (!person) {
      throw newHttpError(400, `La persona ${personId} asociada al propietario no pudo ser encontrada`)
    }

    if (person.contactValueExists(newContact.value)) {
      throw newHttpError(400, `La persona ${personId} asociada al propietario ya tiene un contacto con el mismo valor`)
    }

    const updatedContacts = t.update(person.contacts, { $push: [newContact] })
    const updatedPerson = t.update(person, { contacts: { $merge: updatedContacts } })

    return this.save(updatedPerson)
  }
}

function ownerIncludes (qb, includes) {
  if (includes.indexOf('building') !== -1) {
    const buildingRepo = new BuildingRepository()
    const letBuildingQuery = buildingRepo
      .getQueryBuilder('use', 'b')
      .useKey('t.`buildingId`')
      .where('t.`buildingId` = b.`id`')
    qb
      .letQuery('building', letBuildingQuery)
      .field('building')
  }
}

function mapOwnerIncludes (owner) {
  return Object.assign({}, owner, {
    person: _head(owner.person || []),
    building: _head(owner.building || [])
  })
}

const OwnerStatsParams = t.struct({
  city: t.maybe(t.String)
})

export class OwnerRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = Owner
  }

  async findByIdOrThrow (ownerId) {
    const owner = await this.findById(ownerId)
    if (!owner) {
      throw newHttpError(404, `El propietario ${ownerId} no existe`)
    }

    return owner
  }

  async findByMigratedId (migratedId) {
    const owners = await super.findByMigratedId(migratedId)
    if (owners.length === 0) {
      throw new Error(`Cannot find owner by ${migratedId}`)
    }

    return fromJSON(owners[0], this.Struct)
  }

  // TODO: .map() should not be used for convert owner.person in object
  async findByIdWithIncludes (id, includes = ['person']) {
    if (!id) {
      // noinspection HtmlUnknownTag
      throw new Error('id undefined, expected String or Array<String>')
    }

    const ids = _isArray(id) ? id : [id]
    const idsText = `[${ids.map(id => `'${id}'`).join(', ')}]`
    const qb = this.getQueryBuilder('let').where(`id IN ${idsText}`)

    ownerIncludes(qb, includes)
    const result = await this.query(qb)

    return result.map(mapOwnerIncludes)
  }

  async updateContact (ownerId, contactId, data) {
    const owner = await this.findByIdOrThrow(ownerId)
    const personRepo = new PersonRepository()
    return personRepo.updateContact(owner.personId, contactId, data)
  }

  async createOwnerAndPerson (body) {
    const ownerBody = OwnerBody(body)
    const buildingRepository = new BuildingRepository()
    const buildingId = ownerBody.buildingId
    let building

    if (buildingId) {
      building = await buildingRepository.findByIdOrThrow(buildingId)
    }

    const person = PersonStruct(ownerBody.person)
    body.name = person.fullName()

    const owner = await this.save(body)

    if (building) {
      const worksheetRepository = new WorksheetRepository()
      const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId)
      await worksheetRepository.addOnlyOwner(worksheet, owner)
    }

    return owner
  }

  async addContact (ownerId, body) {
    const personRepo = new PersonRepository()
    const owner = await this.findByIdOrThrow(ownerId)

    return personRepo.addContact(owner.personId, body)
  }

  async getContactPhoneNumber (ownerId, contactId) {
    const personRepo = new PersonRepository()
    const owner = await this.findById(ownerId)
    const person = await personRepo.findById(owner.personId)

    const ownerContactValue = person.findContactById(contactId)

    if (!ownerContactValue) {
      throw newHttpError(400, `El número de contacto para el owner ${ownerId} no existe`)
    }

    return ownerContactValue
  }

  async ownerStats (args = {}) {
    const params = OwnerStatsParams(args)
    const bucket = this.getBucketName()
    const query = _isNil(params.city)
      ? `SELECT t.status, COUNT(*) as count FROM ${bucket} \`t\`
WHERE t.\`_documentType\` = 'owner'
GROUP BY t.status`
      : `SELECT t.status, building[0].address.city, COUNT(*) as count FROM ${bucket} \`t\`
LET building = (SELECT RAW p FROM ${bucket} \`p\` USE KEYS t.buildingId  WHERE id = t.buildingId LIMIT 1)
WHERE t.\`_documentType\` = 'owner' AND t.buildingId IS NOT MISSING
AND LOWER(building[0].address.city) = LOWER('${params.city}')
GROUP BY t.status, building[0].address.city`
    const result = await this.queryRaw(N1qlQuery.fromString(query))

    const totals = {}

    Object.values(OwnerStatus).forEach(status => {
      let total = 0
      _.filter(result, { status }).forEach(({ count }) => {
        total += count
      })
      totals[status] = total
    })

    return totals
  }

  async list (query = {}) {
    const params = new OwnerListQuery(query)
    let results = []

    if (params.contactNumber) {
      const personRepository = new PersonRepository()
      const qbPerson = personRepository.getQueryBuilder('select')
        .limit(params.limit)
        .where('ANY v IN contacts SATISFIES `v`.`value` = ? END', params.contactNumber)
      const personResults = await personRepository.query(qbPerson)
      const personIds = _.uniq(_.map(personResults, 'id'))

      if (personIds && personIds.length) {
        const qbOwners = this.getQueryBuilder('let')
          .limit(params.limit)
          .where(`personId IN ${JSON.stringify(personIds)}`)

        ownerIncludes(qbOwners, ['person'])
        const result = await this.query(qbOwners)
        results = result.map(mapOwnerIncludes)
      }
    }

    return fromJSON({ results }, t.OwnerLitResponse)
  }

  async findAllVerifiedOwnersByBuildingId (buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)

    const results = await this.query(qb)
    const ownerIds = _.map(results, 'id')
    const owners = await this.findByIdWithIncludes(ownerIds, ['person', 'building'])
    return this.getVerifiedOwners(owners)
  }

  getVerifiedOwners (owners) {
    return owners.filter(owner => this.isOwnerVerified(owner))
  }

  isOwnerVerified (owner) {
    const contacts = _.get(owner, 'person.contacts')
    const goodContacts = contacts.filter(c => c.status === 'GOOD')
    return goodContacts.length > 0
  }

  async findOwnersByBuildingId (buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)
    const results = await this.query(qb)

    if (!results || results.length === 0) {
      return []
    }

    const ownerIds = _.map(results, 'id')

    const qbOwners = this.getQueryBuilder().where(`id IN ${JSON.stringify(ownerIds)}`)
    const resultOwners = await this.query(qbOwners)

    return resultOwners.map(owner => fromJSON(owner, Owner))
  }
}
