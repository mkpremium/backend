const app = require('../../../src/app')
const { dependenciesPromise } = app
const buildingOwners = require('../../owner-fix/building-owners')
// const buildingOwners = [
//   {
//     "buildingId": "00221990-4a0b-4b7b-a38f-0c13bb8c72c4",
//     "ownerId": "22b1d79e-8ec4-4ae3-9da5-b9de1363e138"
//   },
// ]

dependenciesPromise
  .then(async () => {
    const { buildingRepository } = app.default.locals.dependenciesContainer

    const errors = (await Promise.all(buildingOwners.map(async ({ ownerId, buildingId }) => {
          try {
            const building = await buildingRepository.findByIdOrThrow(buildingId)
            await buildingRepository.save({ ...building, ownerId })
          } catch (e) {
            return { error: e, buildingId }
          }
        })
      )
    ).filter(res => res !== undefined)

    if (0 < errors.length) {
      console.error(JSON.stringify(errors))
      process.exit(1)
    }

    process.exit(0)
  }).catch((err) => {
    console.error(err)
    process.exit(1)
  }
)


