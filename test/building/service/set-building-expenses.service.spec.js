import { SetBuildingExpensesService } from '../../../src/building/service/set-building-expenses.service'
import { stub } from 'sinon'
import { expect } from 'chai'
import { buildingBuilder } from '../building.builder'

describe('SetBuildingExpensesService', () => {
  let service
  let buildingsRepositoryStub
  const testBuilding = buildingBuilder().build()

  beforeEach(() => {
    buildingsRepositoryStub = {
      get: stub(),
      save: stub()
    }
    service = new SetBuildingExpensesService({ buildingsRepository: buildingsRepositoryStub })
  })

  it('sets total expenses in building', () => {
    buildingsRepositoryStub.get.withArgs(testBuilding.id).resolves(testBuilding)
    buildingsRepositoryStub.save.resolves()
    return service.setTotalExpensesAmount(testBuilding.id, 1000)
      .then(() => {
        expect(buildingsRepositoryStub.save).to.have.been.calledWithMatch(
          b => b.totalExpensesAmount === 1000
        )
      })
  })
})
