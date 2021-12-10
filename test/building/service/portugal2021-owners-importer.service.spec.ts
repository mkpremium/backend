import {
  Portugal2021OwnersImporterService,
  ImportOwnersOfCommand
} from '../../../src/building/service/portugal2021-owners-importer.service'
import { expect } from 'chai'
import { Portugal2021BuildingsRepository } from '../../../src/building/repository/portugal2021-buildings.repository'
import sinon, { stub } from 'sinon'
import { map, of } from 'fp-ts/TaskEither'
import { buildSourceBuilding } from './portugal2021-source-building.builder'
import { constVoid, pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { createLoggerMock } from '../../infrastructure/logger.spec'

describe('Portugal2021OwnersImporterService', () => {
  let service: Portugal2021OwnersImporterService
  let portugal2021BuildingsRepositoryStub
  let ownersRepositoryStub
  const testCmd: ImportOwnersOfCommand = {
    sourceBuildingId: 'test-source-building-id',
  }

  beforeEach(() => {
    portugal2021BuildingsRepositoryStub = {
      get: stub(),
      phoneNumbersFor: stub(),
      save: stub().returns(of(constVoid))
    }
    portugal2021BuildingsRepositoryStub.get.returns(of(buildSourceBuilding({
      importedWithBuildingId: 'test-imported-building-id',
      owners: [
        { dni: '123', address: 'test owner address', name: 'test owner1' },
        { dni: '456', address: 'test owner address', name: 'test owner2' },
      ]
    })))
    ownersRepositoryStub = {
      save: stub().resolves({ id: 'test-saved-owner-id' }),
    }

    service = new Portugal2021OwnersImporterService(
      portugal2021BuildingsRepositoryStub,
      ownersRepositoryStub,
      createLoggerMock()
    )
  })

  it('saves owners', () => {
    portugal2021BuildingsRepositoryStub.phoneNumbersFor.withArgs([ '123', '456' ])
      .returns(of([ { id: '123', phones: [ '666666666' ] }, { id: '456', phones: [ '666666667' ] } ]))
    ownersRepositoryStub.save.withArgs(sinon.match({ name: 'test owner1' })).resolves({ id: 'first-owner-id' })
    ownersRepositoryStub.save.withArgs(sinon.match({ name: 'test owner2' })).resolves({ id: 'second-owner-id' })

    return pipe(
      service.importOwnersOf(testCmd),
      map(() => {
        expect(ownersRepositoryStub.save).to.have.been.calledTwice
        expect(portugal2021BuildingsRepositoryStub.save).to.have.been.calledWithMatch({
          status: 'OWNERS_IMPORTED',
          importedOwners: [
            { dni: '123', id: 'first-owner-id' },
            { dni: '456', id: 'second-owner-id' },
          ]
        })
      }),
      orFail(),
    )()
  })

  it('ignores owners without phones', () => {
    portugal2021BuildingsRepositoryStub.phoneNumbersFor.returns(of([ { id: '123', phones: [ '666666666' ] } ]))

    return pipe(
      service.importOwnersOf(testCmd),
      map(() => {
        expect(ownersRepositoryStub.save).to.have.been.calledOnce
        expect(portugal2021BuildingsRepositoryStub.save).to.have.been.calledWithMatch({
          status: 'OWNERS_IMPORTED',
          importedOwners: [
            { dni: '123', id: 'test-saved-owner-id' },
          ]
        })
      }),
      orFail(),
    )()
  })

  it('saves only one owner by DNI, name, and address', () => {
    portugal2021BuildingsRepositoryStub.phoneNumbersFor.returns(of([ { id: '123', phones: [ '666666666' ] } ]))
    portugal2021BuildingsRepositoryStub.get.returns(of(buildSourceBuilding({
      importedWithBuildingId: 'test-imported-building-id',
      owners: [
        { dni: '123', address: 'test owner address', name: 'test owner' },
        { dni: '123', address: 'test owner address', name: 'test owner' },
      ]
    })))

    return pipe(
      service.importOwnersOf(testCmd),
      map(() => {
        expect(ownersRepositoryStub.save).to.have.been.calledOnce
      }),
      orFail(),
    )()
  })
  it('saves building as FAILED when no owner has phone')
})
