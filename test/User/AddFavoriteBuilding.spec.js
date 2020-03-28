import { expect } from 'chai'
import { fake } from 'sinon'
import { AddFavoriteBuilding } from '../../src/user/AddFavoriteBuilding'

describe('AddFavoriteBuilding', () => {
  it('saves favorite building in user profile', async () => {
    const usersRepository = {
      addFavoriteBuildingToUserOfId: fake.returns(Promise.resolve())
    }
    const addFavoriteBuildingService = new AddFavoriteBuilding(usersRepository)

    const result = await addFavoriteBuildingService.addFavoriteBuilding('user-id', 'building-id')

    expect(usersRepository.addFavoriteBuildingToUserOfId)
      .to.have.been.calledWith('user-id', 'building-id')
    expect(result).to.be.true
  })
})
