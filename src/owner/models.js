import _ from 'lodash'
import _isNil from 'lodash/isNil'
import t from 'tcomb'
import { CouchbaseModel } from '../db/model'
import { OperatorRepository } from '../operator/models'
import { Owner, OwnerBusinessStatus, OwnerStatus } from './owner'

const OwnerStatsParams = t.struct({
  city: t.maybe(t.String)
})

export class OwnerRepository extends CouchbaseModel {
  constructor () {
    super()
    this.Struct = Owner
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
}
