import { expect } from 'chai'
import { fake } from 'sinon'
import { AddFavoriteBuildingService } from '../../../src/user/service/add-favorite-building.service'

describe('AddFavoriteBuildingService', () => {
  it('saves favorite building in user profile', async () => {
    const usersRepository = {
      addFavoriteBuildingToUserOfId: fake.returns(Promise.resolve())
    }
    const addFavoriteBuildingService = new AddFavoriteBuildingService(usersRepository)

    const result = await addFavoriteBuildingService.addFavoriteBuilding('user-id', 'building-id')

    expect(usersRepository.addFavoriteBuildingToUserOfId)
      .to.have.been.calledWith('user-id', 'building-id')
    expect(result).to.be.true
  })
})
