import _ from 'lodash'
import _isArray from 'lodash/isArray'
import _isNil from 'lodash/isNil'
import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { newHttpError } from '../lib/http-error'
import { OperatorRepository } from '../operator/models'
import { Owner, OwnerBody, OwnerBusinessStatus, OwnerStatus, Person } from './owner'

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

  async findByIdWithIncludes (id) {
    if (!id) {
      // noinspection HtmlUnknownTag
      throw new Error('id undefined, expected String or Array<String>')
    }

    const ids = _isArray(id) ? id : [ id ]
    const idsText = `[${ids.map(id => `'${id}'`).join(', ')}]`
    const qb = this.getQueryBuilder('select').where(`id IN ${idsText}`)

    return this.query(qb)
  }

  async createOwnerAndPerson (body) {
    const ownerBody = OwnerBody(body)
    const person = Person(ownerBody.person)
    body.name = person.fullName()

    return this.save(body)
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

  async findAllVerifiedOwnersByBuildingId (buildingId) {
    const qb = this.getQueryBuilder()
      .where('t.`buildingId` = ?', buildingId)

    const results = await this.query(qb)
    const ownerIds = _.map(results, 'id')
    const owners = await this.findByIdWithIncludes(ownerIds)
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
