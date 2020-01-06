import debug from 'debug'
import _ from 'lodash'
import Promise from 'bluebird'
import {updateBuildingToFirebase} from '../../src/firebase/lib/business'
import {BuildingRepository} from '../../src/building/models'
import {OwnerRepository} from '../../src/owner/models'

const debugMigrate = debug('app:migration:synchronize-verified-owners')

export async function synchronizeFirebase () {
  debugMigrate('-----------------------------\nStart process to synchronize verified owners to firebase...')

  const ownerRepository = new OwnerRepository()
  const buildingRepository = new BuildingRepository()
  const buildingIds = await buildingRepository.getBuildingIds()

  // this is for the couchbase limitation
  const buildingIdsClunks = _.chunk(buildingIds, 100)

  await Promise.map(buildingIdsClunks, async (buildingIds) => {
    const buildings = await buildingRepository.findBuildingsByIds(buildingIds)

    await Promise.map(buildings, async (building) => {
      const [owner] = await ownerRepository.findByBuildingWithIncludes(building.id)

      if (owner) {
        try {
          await updateBuildingToFirebase(building, owner)
        } catch (e) {
          console.log('Error updating data to firebase building', building.id)
        }
      }
    })
  }, {concurrency: 1})

  debugMigrate('---------------------------------------------\nProcess ended.')
}
