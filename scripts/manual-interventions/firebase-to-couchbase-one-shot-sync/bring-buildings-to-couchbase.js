const { resolve } = require('path')
const { config } = require('dotenv')
config({ path: resolve(__dirname, '..', '.env') })

import moment from 'moment'

const appMod = require('../../../src/app')
const app = appMod.default
const { dependenciesPromise } = appMod

const { Building } = require('../../../src/types/building')
const buildings = require('/tmp/building_to_couchbase.json')

const _ = require('lodash')

const buildingsToSave = _.map(buildings, ({ foundBuildings: [ foundBuilding ] }) => {
  const { building } = foundBuilding.owner
  const ownerAddress = {
    city: _.get(
      building,
      'owner.address.city',
      _.get(building, 'address.city', undefined)
    ),
    fullAddress: _.get(
      building,
      'owner.address.fullAddress',
      _.get(building, 'address.fullAddress', undefined)
    ),
  }
  return Building({
    ...building,
    recentProposal: building.recentProposal ? {
      ...building.recentProposal,
      createdAt: moment(building.recentProposal.createdAt).toDate()
    } : undefined,
    owner: {
      ...building.owner,
      address: {
        ...ownerAddress,
        number: ownerAddress.number ? ownerAddress.number.toString() : undefined
      }
    }
  })
})

dependenciesPromise.then(async () => {
  const { buildingRepository } = app.locals.dependenciesContainer
  const errors = (await Promise.all(
    buildingsToSave.map(async (b) => {
      try {
        await buildingRepository.save(b)
      } catch (e) {
        return { error: e, buildingId: b.id }
      }
    })
  )).filter(res => res !== undefined)

  if (0 < errors.length) {
    console.error(JSON.stringify(errors))
    process.exit(1)
  }

  console.info("Success!🤸🏾")
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})


