const { config } = require('dotenv')
config()

const app = require('../../src/app')
const { dependenciesPromise } = app

dependenciesPromise
  .then(async () => {
    const negotiationStatusByBuilding = require('/tmp/final_building_status.json')

    const { updateBuildingNegotiationStatusService } = app.default.locals.dependenciesContainer

    const errors = (await Promise.all(
        negotiationStatusByBuilding.map(async ({ buildingId, negotiationStatus }) => {
          try {
            await updateBuildingNegotiationStatusService.updateBuildingStatus(buildingId, negotiationStatus)
          } catch (e) {
            return { error: e, buildingId }
          }
        }))
    ).filter(res => res !== undefined)

    if (0 < errors.length) {
      console.error(JSON.stringify(errors))
      process.exit(1)
    }

    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
