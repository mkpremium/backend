import { expect } from 'chai'
import { createTestContainer } from '../../create-test-container'
import { userBuilder } from '../user.builder'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { orFail } from '../../helpers'
import { UsersRepository } from '../../../src/user/repository/users.repository'

describe('UsersRepository', () => {
  let repository: UsersRepository

  beforeEach(async () => {
    const container = await createTestContainer()
    repository = container.resolve('usersRepository')
  })

  it('finds operator with favorite building', async () => {
    const testBuildingId = 'test-building-id'
    const testFlipper = userBuilder({ favoriteBuildings: [ testBuildingId ] }).build()
    await repository.save(testFlipper)

    await pipe(
      repository.withFavoriteBuilding(testBuildingId),
      map(foundFlipper => {
        expect(foundFlipper.id).to.eql(testFlipper.id)
      }),
      orFail(),
    )()
  })
})

