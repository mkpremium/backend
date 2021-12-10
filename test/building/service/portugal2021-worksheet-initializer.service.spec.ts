import {
  Portugal2021WorksheetInitializerService,
  CreateWorksheetForCommand
} from '../../../src/building/service/portugal2021-worksheet-initializer.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { buildingBuilder } from '../building.builder'
import { map, of } from 'fp-ts/TaskEither'
import { buildSourceBuilding } from './portugal2021-source-building.builder'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'

describe('Portugal2021WorksheetInitializerService', () => {
  let service: Portugal2021WorksheetInitializerService
  let buildingsRepositoryStub
  let portugal2021BuildingsRepositoryStub
  let worksheetRepositoryStub
  const testBuilding = buildingBuilder().build()
  const testSourceBuilding = buildSourceBuilding({ importedWithBuildingId: testBuilding.id })
  const testCmd: CreateWorksheetForCommand = { sourceBuildingId: testSourceBuilding.id }

  beforeEach(() => {
    buildingsRepositoryStub = {
      get: stub().resolves(testBuilding)
    }
    portugal2021BuildingsRepositoryStub = {
      get: stub().returns(of(testSourceBuilding)),
      save: stub().returns(of(undefined)),
    }
    worksheetRepositoryStub = {
      save: stub().resolves(undefined),
    }

    service = new Portugal2021WorksheetInitializerService(
      portugal2021BuildingsRepositoryStub,
      buildingsRepositoryStub,
      worksheetRepositoryStub,
    )
  })

  it('creates worksheet for imported building', () => {
    return pipe(
      service.createWorksheetFor(testCmd),
      map(() => {
        expect(worksheetRepositoryStub.save).to.have.been.calledWithMatch({
          relatedBuildingIds: [ testBuilding.id ]
        })
      }),
      orFail(),
    )()
  })

  it('saves source building with updated status', () => {
    return pipe(
      service.createWorksheetFor(testCmd),
      map(() => {
        expect(portugal2021BuildingsRepositoryStub.save).to.have.been.calledWithMatch({
          status: 'WORKSHEET_CREATED',
        })
      }),
      orFail(),
    )()
  })
})
