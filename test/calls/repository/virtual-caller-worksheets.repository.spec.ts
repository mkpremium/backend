import {
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../../../src/calls/repository/virtual-caller-worksheets.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'

describe('VirtualCallerWorksheetsRepository', () => {
  let repository!: VirtualCallerWorksheetsRepository
  const testWorksheet: VirtualCallerWorksheetProps = {
    worksheetId: 'test-worksheet-id',
    callerId: 'test-virtual-caller-id',
    status: 'CALLING',
    lastContactId: null,
  }

  before(async () => {
    const container = await createTestContainer()
    repository = container.resolve('virtualCallerWorksheetsRepository')

    await repository.save(testWorksheet)
  })

  it('saves and retrieves in progress worksheet', async () => {
    const retrievedWorksheet = await repository.inProgressWorksheetFor(testWorksheet.callerId)

    expect(retrievedWorksheet).to.be.eql({ ...testWorksheet, _documentType: 'virtual-call-worksheet' })
  })

  it('counts worksheets processed by virtual caller', async () => {
    const nbOfProcessedWorksheets = await repository.numberOfWorksheetsProcessedBy(testWorksheet.callerId)

    expect(nbOfProcessedWorksheets).to.be.equal(1)
  })
})
