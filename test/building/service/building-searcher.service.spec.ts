import { BuildingSearcherService, ByCadastreReferenceCommand } from '../../../src/building/service/building-searcher.service'
import { expect } from 'chai'

describe('BuildingSearcherService', () => {
  let service: BuildingSearcherService
  const testCmd: ByCadastreReferenceCommand = {}

  beforeEach(() => {
    service = new BuildingSearcherService()
  })

  it('is not implemented', () => {
    expect(() => service.byCadastreReference(testCmd)).to.throw
  })
})
