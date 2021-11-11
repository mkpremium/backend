import {
  BuildingSearcherService,
  ByCadastreReferenceCommand
} from '../../../src/building/service/building-searcher.service'
import { expect } from 'chai'
import { orFail } from '../../helpers'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { buildingBuilder } from '../building.builder'
import { stub } from 'sinon'
import { taskEither } from 'fp-ts'

describe('BuildingSearcherService', () => {
  let service: BuildingSearcherService
  let buildingsReadRepositoryStub
  const testCmd: ByCadastreReferenceCommand = {
    cadastreReference: '123456789'
  }

  beforeEach(() => {
    buildingsReadRepositoryStub = {
      ofCadastreReference: stub(),
    }
    service = new BuildingSearcherService(buildingsReadRepositoryStub)
  })

  it('searches building in repository', () => {
    const testBuilding = buildingBuilder().build()
    buildingsReadRepositoryStub.ofCadastreReference.withArgs(testCmd.cadastreReference).returns(taskEither.of(testBuilding))

    return pipe(
      service.byCadastreReference(testCmd),
      map((building) => {
        expect(building).to.be.equal(testBuilding)
      }),
      orFail(),
    )
  })
})
