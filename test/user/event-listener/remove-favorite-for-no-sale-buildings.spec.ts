import { stub } from 'sinon'
import { BuildingNegotiationStatusChanged } from '../../../src/building/service/update-building-negotiation-status.service'
import { removeFavoriteForNoSaleBuildings } from '../../../src/user/event-listener/remove-favorite-for-no-sale-buildings'
import * as TE from 'fp-ts/TaskEither'
import { userBuilder } from '../user.builder'
import { expect } from 'chai'
import { DomainEventCatalog } from '../../../src/infrastructure/postgres/domain-event.entity'

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
      name: DomainEventCatalog.BUILDING__NEGOTIATION_STATUS_CHANGED,
      negotiationStatus: 'NO VENDE',
      userId: '',
      buildingId: 'test-building-id',
    })

    expect(usersRepositoryStub.save).to.have
      .been.calledWithMatch(({ favoriteBuildings: [ 'test-other-building-id' ] }))
  })
})
