import {
  deleteAll
} from '../../common'
import WorksheetHelper from '../../helpers/worksheet'
import { WorksheetRepository } from '../../../src/worksheet/models/worksheet'

describe.skip('Logic search worksheets', () => {
  before(async () => {
    await deleteAll()

    await WorksheetHelper.createWorksheetsWithBuildingsAssociated()
  })
  describe('search worksheets by address', () => {
    it.skip('able to search worksheets by building address', async () => {
      const worksheetRepository = new WorksheetRepository()
      const result = await worksheetRepository.searchWorksheets({ query: 'b*' })

      result.results.should.be.a('array')
      result.results.length.should.not.equal(0)
    })
  })
})
