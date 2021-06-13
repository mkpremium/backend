import { expect } from 'chai'
import { stub } from 'sinon'
import { ProcessNextWorksheetCommand, VirtualCallerService } from '../../../src/calls/service/virtual-caller.service'
import { ContactProps } from '../../../src/owner/owner'
import { WorksheetViewProps } from '../../../src/worksheet/repository/worksheet.repository'
import { worksheetViewBuilder } from '../../worksheet/worksheet-view.builder'

const firstContact: ContactProps = {
  id: 'first-contact',
  type: 'TELEFONO',
  value: '666666666',
  status: 'UNDEFINED',
}
const secondContact: ContactProps = {
  id: 'second-contact',
  type: 'TELEFONO',
  value: '666666667',
  status: 'UNDEFINED',
}
const testCmd: ProcessNextWorksheetCommand = {
  queueId: 'test-queue-id',
  callerId: 'test-caller-id',
  contacts: () => [ firstContact, secondContact ],
}
const testWorksheet: WorksheetViewProps = worksheetViewBuilder().build()
const testInProgressWorksheet = {
  worksheetId: testWorksheet.id,
  lastContactId: firstContact.id,
  status: 'PROCESSING',
  callerId: testCmd.callerId,
}

describe('VirtualCallerService', () => {
  let service!: VirtualCallerService
  let takeNextWorksheetServiceStub
  let virtualCallerPhoneStub
  let virtualCallerWorksheetsRepositoryStub
  let worksheetRepositoryStub

  beforeEach(() => {
    takeNextWorksheetServiceStub = {
      nextWorksheetInQueueOfId: stub().resolves(testWorksheet),
    }
    virtualCallerPhoneStub = {
      call: stub().resolves(),
    }
    virtualCallerWorksheetsRepositoryStub = {
      save: stub().resolves(),
      inProgressWorksheetFor: stub(),
    }
    worksheetRepositoryStub = {
      getForCallcenterView: stub()
    }

    service = new VirtualCallerService(
      takeNextWorksheetServiceStub,
      virtualCallerPhoneStub,
      virtualCallerWorksheetsRepositoryStub,
      worksheetRepositoryStub,
    )
  })

  it('stores worksheet to process', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerWorksheetsRepositoryStub.save).to.have.been
      .calledOnceWith({
        worksheetId: testWorksheet.id,
        lastContactId: null,
        status: 'PROCESSING',
        callerId: testCmd.callerId,
      })
  })

  it('calls first contact in worksheet', async () => {
    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith(
      testWorksheet.building.address,
      firstContact
    )
  })

  it('continues with in progress worksheet', async () => {
    virtualCallerWorksheetsRepositoryStub.inProgressWorksheetFor.withArgs(testCmd.callerId)
      .resolves(testInProgressWorksheet)
    worksheetRepositoryStub.getForCallcenterView.withArgs(testInProgressWorksheet.worksheetId)
      .resolves(testWorksheet)

    await service.processNextWorksheet(testCmd)

    expect(virtualCallerPhoneStub.call).to.have.been.calledOnceWith(
      testWorksheet.building.address,
      secondContact
    )
  })

  it('takes next worksheet from queue', async () => {
    await service.processNextWorksheet(testCmd)

    expect(takeNextWorksheetServiceStub.nextWorksheetInQueueOfId).to.have.been
      .calledWith(testCmd.queueId, testCmd.callerId)
  })
})
