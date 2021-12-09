import { Portugal2021OwnersImporterService, ImportOwnersOfCommand } from '../../../src/building/service/portugal2021-owners-importer.service'
import { expect } from 'chai'

describe('Portugal2021OwnersImporterService', () => {
  let service: Portugal2021OwnersImporterService
  const testCmd: ImportOwnersOfCommand = {}

  beforeEach(() => {
    service = new Portugal2021OwnersImporterService()
  })

  it('is not implemented', () => {
    expect(() => service.importOwnersOf(testCmd)).to.throw
  })
})
