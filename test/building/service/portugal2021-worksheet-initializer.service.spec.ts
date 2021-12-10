import {
  Portugal2021WorksheetInitializerService,
  CreateWorksheetForCommand
} from '../../../src/building/service/portugal2021-worksheet-initializer.service'
import { expect } from 'chai'

describe('Portugal2021WorksheetInitializerService', () => {
  let service: Portugal2021WorksheetInitializerService
  const testCmd: CreateWorksheetForCommand = {}

  beforeEach(() => {
    service = new Portugal2021WorksheetInitializerService()
  })

  it('is not implemented', () => {
    expect(() => service.createWorksheetFor(testCmd)).to.throw
  })
})
