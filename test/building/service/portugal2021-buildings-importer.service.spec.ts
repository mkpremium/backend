import {
  ImportSlugCommand,
  Portugal2021BuildingsImporterService
} from '../../../src/building/service/portugal2021-buildings-importer.service'
import { expect } from 'chai'
import * as TE from 'fp-ts/TaskEither'
import { stub } from 'sinon'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { map } from 'fp-ts/TaskEither'

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
      save: stub().resolves(),
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

function buildSourceBuilding (overrides = {}) {
  return {
    ...sourceBuildingPrototype,
    ...overrides,
  }
}

const sourceBuildingPrototype = {
  _documentType: 'portugal-2021-building',
  address: {
    cadastreReferenceA: '',
    cadastreReferenceAM: '5433',
    city: 'PORTO',
    floorArea: '320',
    militaryGeo: {
      x: '156312',
      y: '467427'
    },
    neighborhood: 'RAMALDE',
    number: '3',
    street: 'Antonio da Silva Marinho',
    type: 'Rua',
    usage: 'COMERCIO'
  },
  id: '44d88260-af60-4eb6-bf19-93a95c254b33',
  owners: [],
  slug: '5433-nan-RUA-Antonio_da_Silva_Marinho-3-RAMALDE-PORTO',
  status: 'INBOX',
  statusChangedAt: '2021-12-02T20:30:58.133Z'
}
