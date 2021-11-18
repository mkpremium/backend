import { stub } from 'sinon'
import { BuildingNegotiationStatusChanged } from '../../../src/building/service/update-building-negotiation-status.service'
import { removeFavoriteForNoSaleBuildings } from '../../../src/user/event-listener/remove-favorite-for-no-sale-buildings'
import * as TE from 'fp-ts/TaskEither'
import { userBuilder } from '../user.builder'
import { expect } from 'chai'

describe('removeFavoriteForNoSaleBuildings', () => {
  let listener: (evt: BuildingNegotiationStatusChanged) => Promise<void>
  let usersRepositoryStub

  beforeEach(() => {
    usersRepositoryStub = {
      withFavoriteBuilding: stub().returns(TE.of(undefined)),
      save: stub().resolves(),
    }

    listener = removeFavoriteForNoSaleBuildings({ usersRepository: usersRepositoryStub })
  })

  it('removes no sale buildings from flipper favorite list', async () => {
    const testUserWithFavoriteBuilding = userBuilder({ favoriteBuildings: [ 'test-building-id', 'test-other-building-id' ] }).build()
    usersRepositoryStub.withFavoriteBuilding.returns(TE.of(testUserWithFavoriteBuilding))

    await listener({
      name: 'building.negotiation_status_changed',
      negotiationStatus: 'NO VENDE',
      userId: '',
      buildingId: 'test-building-id',
    })

    expect(usersRepositoryStub.save).to.have
      .been.calledWithMatch(({ favoriteBuildings: [ 'test-other-building-id' ] }))
  })
})
