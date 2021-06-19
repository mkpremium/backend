import {
  VirtualCallerWorksheetProps,
  VirtualCallerWorksheetsRepository
} from '../../../src/calls/repository/virtual-caller-worksheets.repository'
import { createTestContainer } from '../../create-test-container'
import { expect } from 'chai'

describe('VirtualCallerWorksheetsRepository', () => {
  let repository!: VirtualCallerWorksheetsRepository
  const testInProgressWorksheet: VirtualCallerWorksheetProps = {
    worksheetId: 'test-in-proggres-worksheet-id',
    callerId: 'test-virtual-caller-id',
    status: 'CALLING',
    lastContactId: null,
  }
  const testDoneWorksheet: VirtualCallerWorksheetProps = {
    worksheetId: 'test-in-proggres-worksheet-id',
    callerId: 'test-virtual-caller-id',
    status: 'DONE',
    lastContactId: null,
  }

  before(async () => {
    const container = await createTestContainer()
    repository = container.resolve('virtualCallerWorksheetsRepository')

    await repository.save(testInProgressWorksheet)
    await repository.save(testDoneWorksheet)
  })

  it('saves and retrieves in progress worksheet', async () => {
    const retrievedWorksheet = await repository.inProgressWorksheetFor(testInProgressWorksheet.callerId)

    expect(retrievedWorksheet).to.be.eql({ ...testInProgressWorksheet, _documentType: 'virtual-call-worksheet' })
  })

  it('counts worksheets processed by virtual caller', async () => {
    const nbOfProcessedWorksheets = await repository.numberOfWorksheetsProcessedBy(testInProgressWorksheet.callerId)

    expect(nbOfProcessedWorksheets).to.be.equal(1)
  })
})
