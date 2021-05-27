const appMod = require('../../../src/app')
const app = appMod.default
const { dependenciesPromise } = appMod

dependenciesPromise.then(async () => {
  const { ownerRepository } = app.locals.dependenciesContainer
  const ownerContactToSave = require('/tmp/featured-contacts.json')
  const errors = (await Promise.all(
    ownerContactToSave.map(async ({ownerId, contact}) => {
      try {
        await ownerRepository.setOwnerFeaturedContact(ownerId, contact)
      } catch (e) {
        return { error: e, ownerId, contact }
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
