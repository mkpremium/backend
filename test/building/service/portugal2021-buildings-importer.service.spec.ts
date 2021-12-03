import { Portugal2021BuildingsImporterService, ImportSlugCommand } from '../../../src/building/service/portugal2021-buildings-importer.service'
import { expect } from 'chai'

describe('Portugal2021BuildingsImporterService', () => {
  let service: Portugal2021BuildingsImporterService
  const testCmd: ImportSlugCommand = {}

  beforeEach(() => {
    service = new Portugal2021BuildingsImporterService()
  })

  it('is not implemented', () => {
    expect(() => service.importSlug(testCmd)).to.throw
  })
})
