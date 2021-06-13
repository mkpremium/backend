import {
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../../../src/calls/repository/virtual-caller-worksheets.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'

describe('VirtualCallerWorksheetsRepository', () => {
  let repository!: VirtualCallerWorksheetsRepository

  before(async () => {
    const container = await createTestContainer()
    repository = container.resolve('virtualCallerWorksheetsRepository')
  })

  it('saves and retrieves in progress worksheet', async () => {
    const testWorksheet: VirtualCallerWorksheetProps = {
      worksheetId: 'test-worksheet-id',
      callerId: 'test-virtual-caller-id',
      status: 'CALLING',
      lastContactId: null,
    }
    await repository.save(testWorksheet)

    const retrievedWorksheet = await repository.inProgressWorksheetFor(testWorksheet.callerId)

    expect(retrievedWorksheet).to.be.eql({ ...testWorksheet, _documentType: 'virtual-call-worksheet' })
  })
})
