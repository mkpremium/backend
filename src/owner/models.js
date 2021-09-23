import _ from 'lodash'
import _head from 'lodash/head'
import _isArray from 'lodash/isArray'
import _isNil from 'lodash/isNil'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { LegacyBuildingRepository } from '../building/models'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { OperatorRepository } from '../operator/models'
import { ListQuery } from '../types/params'
import { LegacyWorksheetRepository } from '../worksheet/models/worksheet-repository'
import { TypedContactInfo } from './contact'
import {
  FeaturedContact,
  Owner,
  OwnerBody,
  OwnerBusinessStatus,
  OwnerStatus, OwnerWithInclude,
  Person
} from './owner'

function ownerIncludes (qb, includes) {
  if (includes.indexOf('building') !== -1) {
    const legacyBuildingRepository = new LegacyBuildingRepository()
    const letBuildingQuery = legacyBuildingRepository
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
    building: _head(owner.building || [])
  })
}

const OwnerListQuery = ListQuery.extend(
  {
    contactNumber: t.maybe(t.String)
  },
  {
    name: 'OwnerListQuery',
    defaultProps: {
    }
  }
)

const OwnerListingResponse = t.struct(
  {
    results: t.list(OwnerWithInclude)
  },
  {
    name: 'OwnerLitResponse',
    defaultProps: {
      results: []
    }
  }
)

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

  async findByIdWithIncludes (id, includes = []) {
    if (!id) {
      // noinspection HtmlUnknownTag
      throw new Error('id undefined, expected String or Array<String>')
    }

    const ids = _isArray(id) ? id : [ id ]
    const idsText = `[${ids.map(id => `'${id}'`).join(', ')}]`
    const qb = this.getQueryBuilder(includes.length > 0 ? 'let' : 'select').where(`id IN ${idsText}`)

    ownerIncludes(qb, includes)
    const result = await this.query(qb)

    return result.map(mapOwnerIncludes)
  }

  async createOwnerAndPerson (body) {
    const ownerBody = OwnerBody(body)
    const legacyBuildingRepository = new LegacyBuildingRepository()
    const buildingId = ownerBody.buildingId
    let building

    if (buildingId) {
      building = await legacyBuildingRepository.findByIdOrThrow(buildingId)
    }

    const person = Person(ownerBody.person)
    body.name = person.fullName()

    const owner = await this.save(body)

    if (building) {
      const worksheetRepository = new LegacyWorksheetRepository()
      const worksheet = await worksheetRepository.findWorksheetByBuilding(buildingId)
      await worksheetRepository.addOnlyOwner(worksheet, owner)
    }

    return owner
  }

  async addContact (ownerId, addContactRequest) {
    const owner = await this.findByIdOrThrow(ownerId)
    let featuredContact = owner.featuredContact
    const newContact = TypedContactInfo(addContactRequest)

    const { isFeatured } = addContactRequest
    if (isFeatured) {
      featuredContact = FeaturedContact.update(featuredContact || FeaturedContact({}), {
        [ addContactRequest.type === 'EMAIL' ? 'emailId' : 'phoneId' ]: {
          $set: newContact.id
        }
      })
    }

    const updatedOwner = Owner.update(owner, {
      featuredContact: { $set: featuredContact },
      $merge: {
        person: Person.update(owner.person, {
          $merge: {
            contacts: t.update(owner.person.contacts, {
              $push: [ newContact ]
            })
          }
        })
      }
    })
    return this.save(updatedOwner)
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
    const result = await this.queryRaw(query)

    const totals = {}

    Object.values(OwnerStatus).forEach(status => {
      let total = 0
      _.filter(result, { status }).forEach(({ count }) => {
        total += count
      })
      totals[ status ] = total
    })

    return totals
  }

  async ownerBusinessStats () {
    const query = `
SELECT
negotiationStatus as status,
assignedAgentId as meetingWithOperatorId,
COUNT(*) as count
FROM ${this.getBucketName()}
WHERE
_documentType = 'building'
AND negotiationStatus IS NOT MISSING
AND assignedAgentId IS NOT MISSING AND assignedAgentId IS NOT NULL
GROUP BY negotiationStatus, assignedAgentId
`
    const results = await this.queryRaw(query)

    let owners = await Promise.all(results.map(async (result) => {
      const operatorRepository = new OperatorRepository()
      const operator = await operatorRepository.findByIdOrThrow(result.meetingWithOperatorId)

      return { id: result.meetingWithOperatorId, name: operator.username, stats: {} }
    }))
    owners = _.uniqBy(owners, 'id')

    owners.forEach(owner => {
      Object.values(OwnerBusinessStatus).forEach(status => {
        let total = 0
        _.filter(results, { meetingWithOperatorId: owner.id, status }).forEach(({ count }) => {
          total += count
        })

        owner.stats[ status ] = total
      })
    })

    return owners
  }

  async list (query = {}) {
    const params = new OwnerListQuery(query)
    if (!params.contactNumber) {
      return []
    }

    const qb = this.getQueryBuilder()
      .where('ANY v IN person.contacts SATISFIES `v`.`value` = ? END', params.contactNumber)
    const results = await this.query(qb)

    return fromJSON({ results }, OwnerListingResponse)
  }

  async findAllVerifiedOwnersByBuildingId (buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)

    const results = await this.query(qb)
    const ownerIds = _.map(results, 'id')
    const owners = await this.findByIdWithIncludes(ownerIds, [ 'building' ])
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
}
