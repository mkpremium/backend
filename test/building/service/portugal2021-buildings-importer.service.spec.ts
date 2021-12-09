import {
  ImportSlugCommand,
  Portugal2021BuildingsImporterService
} from '../../../src/building/service/portugal2021-buildings-importer.service'
import { expect } from 'chai'
import * as TE from 'fp-ts/TaskEither'
import { map } from 'fp-ts/TaskEither'
import { stub } from 'sinon'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { buildSourceBuilding } from './portugal2021-source-building.builder'

describe('Portugal2021BuildingsImporterService', () => {
  let service: Portugal2021BuildingsImporterService
  let portugal20210BuildingsRepositoryStub
  let buildingsRepositoryStub
  const testCmd: ImportSlugCommand = {
    slug: 'test-slug',
  }

  beforeEach(() => {
    portugal20210BuildingsRepositoryStub = {
      pendingWithSlug: stub().withArgs(testCmd.slug).returns(TE.of([ buildSourceBuilding() ])),
      save: stub().returns(TE.of(undefined)),
    }
    buildingsRepositoryStub = {
      save: stub().resolves({ id: 'test-imported-id' }),
    }

    service = new Portugal2021BuildingsImporterService(
      portugal20210BuildingsRepositoryStub,
      buildingsRepositoryStub,
    )
  })

  it('saves only building when there are no others', () => {
    return pipe(
      service.importSlug(testCmd),
      map(() => {
        expect(buildingsRepositoryStub.save).to.have.been.called
        expect(portugal20210BuildingsRepositoryStub.save).to.have.been.calledWithMatch({
          status: 'BUILDING_IMPORTED',
        })
      }),
      orFail(),
    )()
  })

  it('saves building with FAILED status on failure', () => {
    const testSaveFailure = new Error('Boom')
    buildingsRepositoryStub.save.rejects(testSaveFailure)

    return pipe(
      service.importSlug(testCmd),
      map(() => {
        expect(portugal20210BuildingsRepositoryStub.save).to.have.been.calledWithMatch({
          status: 'FAILED',
          failure: testSaveFailure.message
        })
      }),
      orFail(),
    )()
  })
})
